"""
╔══════════════════════════════════════════════════════════════════════════╗
║          FitAI — AI-Powered Fitness Buddy                               ║
║          Backend: Flask + IBM Watsonx.ai + IBM Granite Foundation Models ║
║          Pure REST transport — no C++ Build Tools required               ║
╚══════════════════════════════════════════════════════════════════════════╝
"""

import os
import json
import logging
import time
import threading
import requests as http_requests
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# ──────────────────────────────────────────────────────────────────────────
# Logger — writes to console and fitai_debug.log
# Set WATSONX_DEBUG=false in .env to silence debug output in production.
# ──────────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG,
    format="[%(levelname)s %(asctime)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("fitai_debug.log", "a"),
    ],
)
log = logging.getLogger("fitai")

# ──────────────────────────────────────────────────────────────────────────
# Load .env
# ──────────────────────────────────────────────────────────────────────────
load_dotenv()

# Keep one connection pool for the lifetime of the Flask process so repeated
# IAM and Watsonx requests can reuse established HTTPS/TLS connections.
http_session = http_requests.Session()


# ──────────────────────────────────────────────────────────────────────────
# IBM Watsonx.ai REST Client
# Uses the REST API directly — avoids ibm-watsonx-ai SDK's ibm-cos-sdk
# dependency which requires C++ Build Tools on Windows.
# ──────────────────────────────────────────────────────────────────────────

class WatsonxClient:
    """Lightweight IBM Watsonx.ai client using the REST API directly."""

    IAM_URL = "https://iam.cloud.ibm.com/identity/token"

    def __init__(self, api_key: str, project_id: str, url: str, model_id: str):
        self.api_key    = api_key
        self.project_id = project_id
        self.base_url   = url.rstrip("/")
        self.model_id   = model_id
        self._access_token = None
        self._token_expires_at = 0
        self._token_refresh_buffer_seconds = 60

    def _get_iam_token(self) -> str:
        """Exchange IBM API key for a short-lived IAM Bearer token and reuse it until expiry."""
        debug = os.getenv("WATSONX_DEBUG", "true").lower() != "false"
        now = time.time()

        if self._access_token and self._token_expires_at > now + self._token_refresh_buffer_seconds:
            if debug:
                log.debug(
                    "Using cached IAM token | expires_in=%.1f seconds",
                    self._token_expires_at - now,
                )
            return self._access_token

        if debug:
            key_preview = self.api_key[:6] + "..." if self.api_key else "(empty)"
            log.debug("IAM token request | api_key=%s len=%d", key_preview, len(self.api_key))

        if not self.api_key:
            raise ValueError(
                "IBM_API_KEY is empty. Ensure your .env file contains IBM_API_KEY=<your key>."
            )

        resp = http_session.post(
            self.IAM_URL,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": self.api_key,
            },
            timeout=30,
        )

        if resp.status_code != 200:
            raise RuntimeError(
                f"IAM token failed — HTTP {resp.status_code}: {resp.text[:300]}"
            )

        token_data = resp.json()
        token = token_data.get("access_token", "")
        if not token:
            raise RuntimeError(f"IAM response has no access_token: {resp.text[:200]}")

        expires_in = int(token_data.get("expires_in", 3600))
        self._access_token = token
        self._token_expires_at = time.time() + expires_in

        if debug:
            log.debug(
                "IAM token obtained | length=%d expires_in=%d",
                len(token),
                expires_in,
            )

        return token

    def generate_text(
        self,
        prompt: str,
        max_new_tokens: int = 1024,
        min_new_tokens: int = 50,
        temperature: float = 0.7,
        top_p: float = 0.9,
        top_k: int = 50,
        repetition_penalty: float = 1.1,
        stop_sequences: list = None,
    ) -> str:
        """Generate text using IBM Granite / Watsonx.ai models."""
        debug = os.getenv("WATSONX_DEBUG", "true").lower() != "false"

        if not self.project_id:
            raise ValueError(
                "IBM_PROJECT_ID is empty. Set it in .env from your Watsonx.ai project settings."
            )

        token    = self._get_iam_token()
        endpoint = f"{self.base_url}/ml/v1/text/generation?version=2023-05-29"

        payload = {
            "model_id":   self.model_id,
            "input":      prompt,
            "project_id": self.project_id,
            "parameters": {
                "max_new_tokens":     max_new_tokens,
                "min_new_tokens":     min_new_tokens,
                "temperature":        temperature,
                "top_p":              top_p,
                "top_k":              top_k,
                "repetition_penalty": repetition_penalty,
                "stop_sequences":     stop_sequences or ["Human:", "User:"],
            },
        }

        if debug:
            log.debug(
                "Watsonx request | endpoint=%s model=%s project=%s prompt_len=%d max_tokens=%d",
                endpoint, self.model_id,
                self.project_id[:8] + "..." if self.project_id else "(empty)",
                len(prompt), max_new_tokens,
            )

        resp = http_session.post(
            endpoint,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type":  "application/json",
                "Accept":        "application/json",
            },
            json=payload,
            timeout=120,
        )

        if debug:
            log.debug("Watsonx response | status=%d body_preview=%s",
                      resp.status_code, resp.text[:400])

        if resp.status_code != 200:
            try:
                err_body  = resp.json()
                ibm_error = err_body.get("errors", [{}])[0]
                code      = ibm_error.get("code", "unknown")
                message   = ibm_error.get("message", resp.text[:200])
            except Exception:
                code    = "parse_error"
                message = resp.text[:300]
            raise RuntimeError(
                f"Watsonx API error HTTP {resp.status_code} | code={code} | {message}"
            )

        data    = resp.json()
        results = data.get("results", [])
        if not results:
            log.warning("Watsonx returned 200 but results[] is empty: %s", data)
            return ""

        generated = results[0].get("generated_text", "").strip()
        if debug:
            log.debug("Generated text length=%d preview=%s", len(generated), generated[:120])

        return generated


# ══════════════════════════════════════════════════════════════════════════
# ████████████████████████████████████████████████████████████████████████
# ██                                                                    ██
# ██          AGENT INSTRUCTIONS — CUSTOMIZE HERE                      ██
# ██                                                                    ██
# ██  Edit this section to change the AI Fitness Coach's personality,  ██
# ██  coaching style, safety rules, specializations, and response tone.██
# ██                                                                    ██
# ████████████████████████████████████████████████████████████████████████
# ══════════════════════════════════════════════════════════════════════════

AGENT_INSTRUCTIONS = {

    # ──────────────────────────────────────────────────────────────────
    # AGENT IDENTITY & ROLE
    # ──────────────────────────────────────────────────────────────────
    "agent_name": "FitAI Coach",
    "agent_role": (
        "You are FitAI Coach, an expert AI-powered fitness and wellness coach powered by "
        "IBM Watsonx.ai and IBM Granite Foundation Models. You specialise in creating "
        "personalized, science-backed workout plans, nutrition guidance, and holistic "
        "wellness strategies for people of all fitness levels — from complete beginners "
        "to advanced athletes."
    ),

    # ──────────────────────────────────────────────────────────────────
    # TONE & PERSONALITY
    # Change: "friendly" | "professional" | "motivational" | "clinical"
    # ──────────────────────────────────────────────────────────────────
    "tone": "energetic, motivational, and supportive",
    "personality_traits": [
        "encouraging and positive — celebrate small wins",
        "clear, practical, and science-based",
        "empathetic to fitness struggles and plateaus",
        "never judgmental about current fitness level or body type",
        "focused on sustainable long-term lifestyle changes over quick fixes",
        "safety-first approach to all exercise recommendations",
    ],

    # ──────────────────────────────────────────────────────────────────
    # FITNESS SPECIALIZATIONS
    # Set True/False to enable or disable each coaching area.
    # ──────────────────────────────────────────────────────────────────
    "fitness_specializations": {
        "weight_loss":              True,
        "weight_gain":              True,
        "muscle_gain":              True,
        "home_workouts":            True,
        "gym_workouts":             True,
        "cardio_training":          True,
        "strength_training":        True,
        "hiit_training":            True,
        "yoga_flexibility":         True,
        "sports_performance":       True,
        "senior_fitness":           True,
        "beginner_fitness":         True,
        "postpartum_fitness":       True,
        "injury_rehabilitation":    True,
    },

    # ──────────────────────────────────────────────────────────────────
    # NUTRITION COACHING
    # ──────────────────────────────────────────────────────────────────
    "nutrition_coaching": {
        "meal_planning":            True,
        "macro_tracking":           True,
        "hydration_guidance":       True,
        "pre_workout_nutrition":    True,
        "post_workout_nutrition":   True,
        "healthy_snack_ideas":      True,
        "supplement_basics":        True,
        "calorie_deficit_guidance": True,
        "calorie_surplus_guidance": True,
    },

    # ──────────────────────────────────────────────────────────────────
    # RESPONSE FORMAT RULES
    # ──────────────────────────────────────────────────────────────────
    "response_format": {
        "use_bullet_points":        True,
        "include_sets_reps":        True,
        "include_calorie_info":     True,
        "include_macros":           True,
        "include_rest_periods":     True,
        "always_end_with_tip":      True,   # always end with a 💪 Pro Tip
        "max_response_length":      "detailed but concise — no unnecessary filler",
    },

    # ──────────────────────────────────────────────────────────────────
    # SAFETY & MEDICAL RULES  ← Critical — do not disable lightly
    # ──────────────────────────────────────────────────────────────────
    "safety_rules": {
        "always_recommend_doctor_before_new_program":    True,
        "do_not_prescribe_medications_or_supplements":   True,
        "warn_extreme_caloric_restriction":              True,   # below 1200 kcal
        "avoid_dangerous_exercise_recommendations":      True,
        "flag_injury_concerns":                          True,
        "safe_weight_loss_rate_kg_per_week":             0.5,
        "safe_weight_gain_rate_kg_per_week":             0.25,
        "disclaimer": (
            "⚠️ I am an AI fitness coach. My recommendations are for general wellness "
            "purposes only and do not constitute medical advice. Always consult a "
            "qualified healthcare provider before starting a new exercise or diet program, "
            "especially if you have any medical conditions or injuries."
        ),
    },

    # ──────────────────────────────────────────────────────────────────
    # DEFAULT FITNESS & NUTRITION TARGETS
    # Used when personalized user data is not available.
    # ──────────────────────────────────────────────────────────────────
    "default_targets": {
        "sedentary_calories":       1800,
        "moderately_active_calories": 2200,
        "active_calories":          2600,
        "protein_percent":          30,   # % of total calories
        "carbs_percent":            45,
        "fat_percent":              25,
        "fiber_grams_per_day":      30,
        "water_liters_per_day":     2.5,
        "workout_days_per_week":    3,    # beginner default
        "rest_days_per_week":       4,
    },

    # ──────────────────────────────────────────────────────────────────
    # WORKOUT PLANNING PREFERENCES
    # ──────────────────────────────────────────────────────────────────
    "workout_planning": {
        "default_session_duration_minutes": 45,
        "include_warmup":           True,
        "include_cooldown":         True,
        "include_stretching":       True,
        "progressive_overload":     True,
        "explain_each_exercise":    True,
        "equipment_options":        ["no equipment", "resistance bands", "dumbbells", "full gym"],
    },

    # ──────────────────────────────────────────────────────────────────
    # MOTIVATION STYLE
    # ──────────────────────────────────────────────────────────────────
    "motivation": {
        "use_positive_affirmations": True,
        "celebrate_milestones":      True,
        "daily_challenge":           True,
        "mindset_coaching":          True,
    },
}


# ──────────────────────────────────────────────────────────────────────────
# Build system prompt from AGENT_INSTRUCTIONS
# ──────────────────────────────────────────────────────────────────────────

def build_system_prompt(user_profile: dict = None) -> str:
    """Construct the AI system prompt from AGENT_INSTRUCTIONS + optional user profile."""
    inst   = AGENT_INSTRUCTIONS
    safety = inst["safety_rules"]

    profile_context = ""
    if user_profile:
        profile_fields = (
            ("Name", "name", ""), ("Age", "age", ""),
            ("Gender", "gender", ""), ("Height", "height", " cm"),
            ("Weight", "weight", " kg"), ("Fitness goal", "goal", ""),
            ("Fitness level", "level", ""), ("Equipment", "equipment", ""),
            ("Health conditions", "conditions", ""),
        )
        supplied_fields = [
            f"- {label}: {user_profile[key]}{unit}"
            for label, key, unit in profile_fields
            if user_profile.get(key) not in (None, "")
        ]
        if supplied_fields:
            profile_context = "\n\nUSER PROFILE:\n" + "\n".join(supplied_fields)

    prompt = f"""
You are FitAI Coach, a science-based fitness and wellness coach. Give personalized,
practical workout, nutrition, and healthy-lifestyle guidance for every fitness level.

STYLE: {inst['tone']}. Be encouraging, clear, non-judgmental, and concise. Use clear
structure for plans; include sets, reps, rest, and form cues for workouts, and calories
and macros for nutrition when relevant. End with one practical Pro Tip.

SAFETY: {safety['disclaimer']} Do not prescribe medication. Avoid unsafe exercise advice;
flag pain, injuries, or relevant health conditions for professional evaluation. Do not
recommend intake below 1200 kcal/day; limit weight loss guidance to
{safety['safe_weight_loss_rate_kg_per_week']} kg/week.
{profile_context}
""".strip()

    return prompt


MAX_HISTORY_TURNS = 4
MAX_HISTORY_CHARS = 1600


def build_full_prompt(user_message: str, history: list, user_profile: dict = None) -> str:
    """Build the complete prompt with the most relevant bounded conversation context."""
    system_prompt = build_system_prompt(user_profile)
    conversation = f"[SYSTEM]\n{system_prompt}\n\n"

    # Preserve recent conversational memory without allowing long Granite
    # responses or duplicate messages to grow every subsequent request.
    cleaned_history = []
    for turn in history:
        role = "user" if turn.get("role") == "user" else "assistant"
        content = str(turn.get("content", "")).strip()
        if not content:
            continue
        if cleaned_history and cleaned_history[-1] == (role, content):
            continue
        cleaned_history.append((role, content))

    # The current message is supplied separately. Remove a matching most-recent
    # user turn (for example, the Chat page's regenerate action) so it is not
    # sent twice while retaining the previous assistant response as context.
    current_message = user_message.strip()
    for index in range(len(cleaned_history) - 1, -1, -1):
        role, content = cleaned_history[index]
        if role == "user":
            if content == current_message:
                del cleaned_history[index]
            break

    context_turns = []
    remaining_chars = MAX_HISTORY_CHARS
    for role, content in reversed(cleaned_history[-MAX_HISTORY_TURNS:]):
        if remaining_chars <= 0:
            break
        clipped_content = content[:remaining_chars]
        context_turns.append((role, clipped_content))
        remaining_chars -= len(clipped_content)

    for role, content in reversed(context_turns):
        speaker = "Human" if role == "user" else "Assistant"
        conversation += f"{speaker}: {content}\n"

    conversation += f"Human: {user_message}\nAssistant:"
    return conversation


# ──────────────────────────────────────────────────────────────────────────
# Math Utilities — BMI, TDEE, Water Intake
# All calculations done in Python; IBM Granite used for personalized advice.
# ──────────────────────────────────────────────────────────────────────────

def calculate_bmi(weight_kg: float, height_cm: float) -> dict:
    """Calculate BMI and return category with color indicator."""
    if height_cm <= 0 or weight_kg <= 0:
        return {"error": "Invalid input: weight and height must be positive numbers."}
    height_m = height_cm / 100
    bmi      = round(weight_kg / (height_m ** 2), 1)
    if bmi < 18.5:
        category, color = "Underweight",    "#3b82d4"
    elif bmi < 25.0:
        category, color = "Normal Weight",  "#22c55e"
    elif bmi < 30.0:
        category, color = "Overweight",     "#f59e0b"
    else:
        category, color = "Obese",          "#ef4444"
    return {
        "bmi":               bmi,
        "category":          category,
        "color":             color,
        "ideal_weight_min":  round(18.5 * (height_m ** 2), 1),
        "ideal_weight_max":  round(24.9 * (height_m ** 2), 1),
        "height_cm":         height_cm,
        "weight_kg":         weight_kg,
    }


def calculate_tdee(
    weight_kg: float,
    height_cm: float,
    age: int,
    gender: str,
    activity_level: str,
) -> dict:
    """Calculate BMR (Harris-Benedict) and TDEE with macro breakdown."""
    gender = gender.lower()
    if gender == "male":
        bmr = 88.362 + (13.397 * weight_kg) + (4.799 * height_cm) - (5.677 * age)
    else:
        bmr = 447.593 + (9.247 * weight_kg) + (3.098 * height_cm) - (4.330 * age)

    multipliers = {
        "sedentary":   1.2,
        "light":       1.375,
        "moderate":    1.55,
        "active":      1.725,
        "very_active": 1.9,
    }
    multiplier   = multipliers.get(activity_level.lower(), 1.55)
    tdee         = round(bmr * multiplier)
    targets      = AGENT_INSTRUCTIONS["default_targets"]

    protein_g    = round((tdee * targets["protein_percent"] / 100) / 4)
    carbs_g      = round((tdee * targets["carbs_percent"]   / 100) / 4)
    fat_g        = round((tdee * targets["fat_percent"]     / 100) / 9)

    # Goal-based calorie adjustments
    weight_loss_calories  = tdee - 500   # ~0.5 kg/week deficit
    weight_gain_calories  = tdee + 300   # lean bulk surplus
    muscle_gain_calories  = tdee + 200   # recomp surplus

    return {
        "bmr":                   round(bmr),
        "tdee":                  tdee,
        "protein_g":             protein_g,
        "carbs_g":               carbs_g,
        "fat_g":                 fat_g,
        "fiber_g":               targets["fiber_grams_per_day"],
        "water_l":               targets["water_liters_per_day"],
        "weight_loss_calories":  weight_loss_calories,
        "weight_gain_calories":  weight_gain_calories,
        "muscle_gain_calories":  muscle_gain_calories,
    }


# ──────────────────────────────────────────────────────────────────────────
# Watsonx Client Factory
# ──────────────────────────────────────────────────────────────────────────

# ──────────────────────────────────────────────────────────────────────────
# Model selection — region-specific.
#
# IBM Watsonx.ai eu-de (Frankfurt) available Granite models (verified 2025):
#   ibm/granite-4-h-small              ✅ RECOMMENDED — IBM Granite, generation + chat support
#
# IBM Watsonx.ai us-south available Granite instruct models:
#   ibm/granite-3-2-8b-instruct        ✅ compact Granite 3.2
#   ibm/granite-3-2-2b-instruct        lighter variant
#
# Set WATSONX_MODEL_ID in your .env to override the default below.
# ──────────────────────────────────────────────────────────────────────────
WATSONX_MODEL_ID = os.getenv("WATSONX_MODEL_ID", "ibm/granite-4-h-small")
CHAT_MAX_NEW_TOKENS = 512
WORKOUT_PLAN_MAX_NEW_TOKENS = 900
NUTRITION_PLAN_MAX_NEW_TOKENS = 1200
_watsonx_client = None
_watsonx_client_lock = threading.Lock()

def get_watsonx_client() -> WatsonxClient:
    """Return a configured WatsonxClient using credentials from .env."""
    global _watsonx_client

    if _watsonx_client is not None:
        return _watsonx_client

    with _watsonx_client_lock:
        if _watsonx_client is not None:
            return _watsonx_client

        api_key    = os.getenv("IBM_API_KEY", "")
        project_id = os.getenv("IBM_PROJECT_ID", "")
        url        = os.getenv("IBM_URL", "https://us-south.ml.cloud.ibm.com")

        log.debug(
            "WatsonxClient | api_key_set=%s project=%s url=%s model=%s",
            bool(api_key),
            project_id[:8] + "..." if project_id else "(empty)",
            url, WATSONX_MODEL_ID,
        )

        _watsonx_client = WatsonxClient(
            api_key    = api_key,
            project_id = project_id,
            url        = url,
            model_id   = WATSONX_MODEL_ID,
        )
        return _watsonx_client


# ──────────────────────────────────────────────────────────────────────────
# Flask Application
# ──────────────────────────────────────────────────────────────────────────

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "fitai-dev-secret-change-in-production")
CORS(app, resources={r"/api/*": {"origins": os.getenv("ALLOWED_ORIGINS", "*")}})


# ── API: Health Check ──────────────────────────────────────────────────────

@app.route("/api/health")
def health_check():
    return jsonify({
        "status":    "healthy",
        "agent":     AGENT_INSTRUCTIONS["agent_name"],
        "model":     WATSONX_MODEL_ID,
        "timestamp": datetime.now().isoformat(),
        "version":   "1.0.0",
    })


# ── API: AI Fitness Coach Chat ─────────────────────────────────────────────

@app.route("/api/chat", methods=["POST"])
def chat():
    """Main AI chat endpoint — sends message to IBM Granite and returns response."""
    total_start_time = time.perf_counter()

    request_receive_start = time.perf_counter()
    data         = request.get_json(force=True)
    user_message = data.get("message", "").strip()
    history      = data.get("history", [])
    user_profile = data.get("user_profile", {})
    request_receive_elapsed_ms = (time.perf_counter() - request_receive_start) * 1000
    log.info("[PERF] request receive | %.3f ms", request_receive_elapsed_ms)

    if not user_message:
        return jsonify({"error": "Empty message"}), 400

    try:
        client = get_watsonx_client()

        prompt_build_start = time.perf_counter()
        prompt = build_full_prompt(user_message, history, user_profile or None)
        prompt_build_elapsed_ms = (time.perf_counter() - prompt_build_start) * 1000
        log.info("[PERF] prompt build | %.3f ms", prompt_build_elapsed_ms)

        api_call_start = time.perf_counter()
        result = client.generate_text(
            prompt=prompt,
            max_new_tokens=CHAT_MAX_NEW_TOKENS,
        )
        api_call_elapsed_ms = (time.perf_counter() - api_call_start) * 1000
        log.info("[PERF] IBM watsonx API call | %.3f ms", api_call_elapsed_ms)

        parse_start = time.perf_counter()
        response = result.strip()
        for prefix in ["Assistant:", "FitAI Coach:", "Coach:"]:
            if response.startswith(prefix):
                response = response[len(prefix):].strip()
        parse_elapsed_ms = (time.perf_counter() - parse_start) * 1000
        log.info("[PERF] response parsing | %.3f ms", parse_elapsed_ms)

        total_elapsed_ms = (time.perf_counter() - total_start_time) * 1000
        log.info("[PERF] total request processing | %.3f ms", total_elapsed_ms)

        return jsonify({
            "response":  response,
            "timestamp": datetime.now().isoformat(),
            "model":     WATSONX_MODEL_ID,
        })

    except Exception as exc:
        total_elapsed_ms = (time.perf_counter() - total_start_time) * 1000
        log.info("[PERF] total request processing | %.3f ms", total_elapsed_ms)
        log.error("Chat endpoint failed: %s", exc, exc_info=True)
        return jsonify({
            "error":    str(exc),
            "response": f"⚠️ FitAI error: {str(exc)}\nCheck the Flask console for details.",
        }), 500


# ── API: Workout Plan Generator ────────────────────────────────────────────

@app.route("/api/workout-plan", methods=["POST"])
def workout_plan():
    """Generate a personalized workout plan using IBM Granite."""
    data = request.get_json(force=True)

    goal          = data.get("goal", "general fitness")
    level         = data.get("level", "beginner")
    duration_weeks = data.get("duration_weeks", 4)
    days_per_week = data.get("days_per_week", 3)
    location      = data.get("location", "home")       # "home" or "gym"
    equipment     = data.get("equipment", "no equipment")
    focus         = data.get("focus", "full body")      # "upper body", "lower body", etc.
    user_profile  = data.get("user_profile", {})

    prompt_text = (
        f"Create a detailed {duration_weeks}-week {level} workout plan. "
        f"Goal: {goal}. Training location: {location}. Equipment: {equipment}. "
        f"Workout days: {days_per_week} days per week. Focus area: {focus}. "
        f"For each workout session include: warm-up (5-10 min), main exercises with sets, reps, "
        f"and rest periods, and cool-down/stretching (5 min). "
        f"Explain proper form for each exercise. Include progression guidelines. "
        f"Structure as Week 1, Week 2, etc."
    )

    try:
        client = get_watsonx_client()
        prompt = build_full_prompt(prompt_text, [], user_profile or None)
        result = client.generate_text(
            prompt=prompt,
            max_new_tokens=WORKOUT_PLAN_MAX_NEW_TOKENS,
        )
        return jsonify({
            "plan":      result.strip(),
            "goal":      goal,
            "level":     level,
            "timestamp": datetime.now().isoformat(),
        })
    except Exception as exc:
        log.error("Workout plan failed: %s", exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


# ── API: Nutrition Guidance ────────────────────────────────────────────────

@app.route("/api/nutrition", methods=["POST"])
def nutrition_guidance():
    """Generate personalized nutrition and meal guidance using IBM Granite."""
    data = request.get_json(force=True)

    goal          = data.get("goal", "balanced healthy eating")
    calories      = data.get("calories", 2000)
    diet_type     = data.get("diet_type", "balanced")   # vegetarian, vegan, keto, etc.
    food_type     = data.get("food_type", "Vegetarian")
    duration      = data.get("duration", "7-day")
    meals_per_day = data.get("meals_per_day", 3)
    allergies     = data.get("allergies", "none")
    budget_amount = data.get("budget_amount", 0)
    budget_period = data.get("budget_period", "daily")
    user_profile  = data.get("user_profile", {})

    age      = data.get("age") or user_profile.get("age", "unknown")
    gender   = data.get("gender") or user_profile.get("gender", "unspecified")
    height   = data.get("height") or user_profile.get("height", "unknown")
    weight   = data.get("weight") or user_profile.get("weight", "unknown")
    activity = data.get("activity") or user_profile.get("activity", "Moderate")
    region   = data.get("region") or data.get("country") or user_profile.get("region") or user_profile.get("country")
    region_text = f" Region or country: {region}." if region else ""

    prompt_text = (
        f"FitAI must generate a personalized nutrition plan that always satisfies both the user's fitness goal and the user's available food budget. "
        f"Use all provided user details: age {age}, gender {gender}, height {height} cm, weight {weight} kg, activity level {activity}, fitness goal '{goal}', diet preference '{diet_type}', food preference '{food_type}', meals per day {meals_per_day}, allergies '{allergies or 'none'}', budget amount ₹{budget_amount}, budget period {budget_period}.{region_text} "
        f"First determine the approximate daily food budget by converting weekly budgets to a daily value (divide by 7) or monthly budgets to a daily value (divide by 30). "
        f"Plan every meal so that the estimated total daily food cost stays within the available budget and maintain nutrition quality as high as possible within that budget. "
        f"Choose foods according to affordability: for lower budgets prefer nutritious local staples and affordable sources of protein, for medium budgets offer a balanced variety, and for higher budgets include premium yet practical options. "
        f"Do not recommend difficult-to-obtain or unusually expensive foods for the user's region unless the budget comfortably supports them. "
        f"If the budget is too low to realistically meet the fitness goal, explain this politely, identify the nutritional limitations, recommend the smallest practical budget increase, suggest affordable alternative foods, and still generate the best possible plan within the current budget. "
        f"If the budget is very high, avoid unnecessary expense and choose foods that provide real nutritional benefit, variety, sustainability, and practicality. "
        f"Always honor both the fitness goal and the budget constraint. Never ignore either one. "
        f"Estimate approximate costs and include: Estimated Daily Cost, Estimated Weekly Cost, and Estimated Budget Utilization, making it clear whether the plan stays within the user's budget. "
        f"Include these output sections: Nutrition Summary, Daily Meal Plan, Estimated Food Cost, Weekly Grocery List, Budget Optimization Suggestions, Affordable Alternatives (if applicable), Hydration Recommendation, Nutrition Tips, and Medical Disclaimer. "
        f"Include breakfast, mid-morning snack, lunch, evening snack, and dinner. "
        f"Show calorie count and macros (protein/carbs/fats) for each meal. "
        f"Include meal prep tips, timing recommendations, hydration guidance, and a grocery shopping list for the week. "
        f"FitAI is designed to generate plans that are medically sensible and financially practical, with the budget informing ingredient selection, meal planning, grocery recommendations, and overall nutrition strategy throughout the entire response."
    )

    try:
        client = get_watsonx_client()
        prompt = build_full_prompt(prompt_text, [], user_profile or None)
        result = client.generate_text(
            prompt=prompt,
            max_new_tokens=NUTRITION_PLAN_MAX_NEW_TOKENS,
        )
        return jsonify({
            "guidance":  result.strip(),
            "goal":      goal,
            "calories":  calories,
            "timestamp": datetime.now().isoformat(),
        })
    except Exception as exc:
        log.error("Nutrition guidance failed: %s", exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


# ── API: BMI Calculator ────────────────────────────────────────────────────

@app.route("/api/bmi", methods=["POST"])
def bmi_calc():
    """Calculate BMI — pure math, no AI call needed."""
    data   = request.get_json(force=True)
    try:
        weight = float(data.get("weight", 0))
        height = float(data.get("height", 0))
    except (TypeError, ValueError):
        return jsonify({"error": "weight and height must be numeric"}), 400

    result = calculate_bmi(weight, height)
    if "error" in result:
        return jsonify(result), 400
    return jsonify(result)


# ── API: Calorie (TDEE) Calculator ────────────────────────────────────────

@app.route("/api/calories", methods=["POST"])
def calorie_calc():
    """Calculate TDEE and macros — pure math, no AI call needed."""
    data = request.get_json(force=True)
    try:
        result = calculate_tdee(
            weight_kg      = float(data["weight"]),
            height_cm      = float(data["height"]),
            age            = int(data["age"]),
            gender         = data.get("gender", "male"),
            activity_level = data.get("activity", "moderate"),
        )
        return jsonify(result)
    except (KeyError, ValueError, TypeError) as exc:
        return jsonify({"error": f"Invalid input: {exc}"}), 400


# ── API: Motivation Quote ──────────────────────────────────────────────────

@app.route("/api/motivation", methods=["GET"])
def daily_motivation():
    """Generate a daily fitness motivation message using IBM Granite."""
    mood  = request.args.get("mood", "energized")
    goal  = request.args.get("goal", "fitness")

    prompt_text = (
        f"Generate an inspiring, original fitness motivation message for someone feeling {mood} "
        f"today who is working toward their {goal} goal. "
        f"Make it personal, powerful, and actionable. 2-3 sentences max. "
        f"Do not use clichés. End with a specific action they can take RIGHT NOW."
    )

    try:
        client = get_watsonx_client()
        prompt = build_full_prompt(prompt_text, [], None)
        result = client.generate_text(prompt=prompt, max_new_tokens=200, min_new_tokens=30)
        return jsonify({"motivation": result.strip(), "timestamp": datetime.now().isoformat()})
    except Exception as exc:
        log.error("Motivation failed: %s", exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


# ── API: Exercise Explanation ──────────────────────────────────────────────

@app.route("/api/exercise", methods=["POST"])
def exercise_info():
    """Get detailed information about a specific exercise using IBM Granite."""
    data     = request.get_json(force=True)
    exercise = data.get("exercise", "").strip()
    level    = data.get("level", "beginner")

    if not exercise:
        return jsonify({"error": "Exercise name required"}), 400

    prompt_text = (
        f"Explain the '{exercise}' exercise in detail for a {level} fitness level. Include: "
        f"1) Muscles worked (primary and secondary), "
        f"2) Step-by-step instructions with form cues, "
        f"3) Common mistakes to avoid, "
        f"4) Beginner modifications, "
        f"5) Advanced progressions, "
        f"6) Recommended sets and reps for different goals (weight loss, muscle gain, endurance), "
        f"7) Safety tips and contraindications."
    )

    try:
        client = get_watsonx_client()
        prompt = build_full_prompt(prompt_text, [], None)
        result = client.generate_text(prompt=prompt, max_new_tokens=1000)
        return jsonify({
            "exercise": exercise,
            "info":     result.strip(),
            "timestamp": datetime.now().isoformat(),
        })
    except Exception as exc:
        log.error("Exercise info failed: %s", exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


# ── API: Recovery Advice ───────────────────────────────────────────────────

@app.route("/api/recovery", methods=["POST"])
def recovery_advice():
    """Generate recovery and rest advice using IBM Granite."""
    data     = request.get_json(force=True)
    activity = data.get("activity", "general workout")
    soreness = data.get("soreness", "moderate")

    prompt_text = (
        f"Provide comprehensive muscle recovery advice for someone who just completed {activity} "
        f"and is experiencing {soreness} muscle soreness. Include: "
        f"1) Immediate post-workout recovery steps, "
        f"2) Nutrition for recovery (specific foods and timing), "
        f"3) Sleep optimization tips, "
        f"4) Active recovery exercises, "
        f"5) When to return to training, "
        f"6) Signs that indicate you should rest longer."
    )

    try:
        client = get_watsonx_client()
        prompt = build_full_prompt(prompt_text, [], None)
        result = client.generate_text(prompt=prompt, max_new_tokens=800)
        return jsonify({
            "advice":   result.strip(),
            "timestamp": datetime.now().isoformat(),
        })
    except Exception as exc:
        log.error("Recovery advice failed: %s", exc, exc_info=True)
        return jsonify({"error": str(exc)}), 500


# ── API: Debug / Diagnostic ────────────────────────────────────────────────

@app.route("/api/debug")
def debug_watsonx():
    """Diagnostic endpoint — tests the full Watsonx.ai connection chain.
    Remove or protect with auth in production."""
    result = {}

    api_key    = os.getenv("IBM_API_KEY", "")
    project_id = os.getenv("IBM_PROJECT_ID", "")
    url        = os.getenv("IBM_URL", "https://us-south.ml.cloud.ibm.com")

    result["env"] = {
        "IBM_API_KEY_set":    bool(api_key),
        "IBM_API_KEY_length": len(api_key),
        "IBM_API_KEY_preview": api_key[:6] + "..." if api_key else "(empty)",
        "IBM_PROJECT_ID_set": bool(project_id),
        "IBM_PROJECT_ID":     project_id,
        "IBM_URL":            url,
        "WATSONX_MODEL_ID":   WATSONX_MODEL_ID,
    }

    # Step 1: IAM token
    try:
        iam_resp = http_session.post(
            WatsonxClient.IAM_URL,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            data={"grant_type": "urn:ibm:params:oauth:grant-type:apikey", "apikey": api_key},
            timeout=30,
        )
        if iam_resp.status_code == 200:
            token = iam_resp.json().get("access_token", "")
            result["iam_token"] = {"status": "OK", "token_length": len(token)}
        else:
            result["iam_token"] = {
                "status": f"FAILED HTTP {iam_resp.status_code}",
                "body":   iam_resp.text[:300],
            }
            return jsonify(result), 502
    except Exception as e:
        result["iam_token"] = {"status": "EXCEPTION", "detail": str(e)}
        return jsonify(result), 502

    # Step 2: Generation test
    try:
        gen_resp = http_session.post(
            f"{url.rstrip('/')}/ml/v1/text/generation?version=2023-05-29",
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            json={
                "model_id":   WATSONX_MODEL_ID,
                "input":      "Say: FitAI is ready!",
                "project_id": project_id,
                "parameters": {"max_new_tokens": 20, "min_new_tokens": 5},
            },
            timeout=30,
        )
        if gen_resp.status_code == 200:
            generated = gen_resp.json().get("results", [{}])[0].get("generated_text", "")
            result["generation_test"] = {"status": "OK", "response": generated.strip()}
        else:
            try:
                ibm_err = gen_resp.json().get("errors", [{}])[0]
            except Exception:
                ibm_err = {"raw": gen_resp.text[:300]}
            result["generation_test"] = {
                "status":            f"FAILED HTTP {gen_resp.status_code}",
                "ibm_error_code":    ibm_err.get("code", "?"),
                "ibm_error_message": ibm_err.get("message", gen_resp.text[:200]),
            }
            return jsonify(result), 502
    except Exception as e:
        result["generation_test"] = {"status": "EXCEPTION", "detail": str(e)}
        return jsonify(result), 502

    result["overall"] = "✅ ALL CHECKS PASSED — FitAI Watsonx.ai is configured correctly"
    return jsonify(result), 200


# ──────────────────────────────────────────────────────────────────────────
# Entry Point
# ──────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port  = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "True").lower() == "true"
    print(f"""
╔══════════════════════════════════════════════════════════════╗
║  💪  FitAI — AI-Powered Fitness Buddy                        ║
║  🌐  Backend running on http://localhost:{port}                  ║
║  🤖  Model: {WATSONX_MODEL_ID:<44}║
║  🔧  IBM Watsonx.ai — pure REST, no C++ required             ║
╚══════════════════════════════════════════════════════════════╝
    """)
    app.run(host="0.0.0.0", port=port, debug=debug)
