# 💪 FitAI — AI-Powered Fitness Buddy

**FitAI** is a professional full-stack fitness web application powered by **IBM Watsonx.ai** and **IBM Granite Foundation Models**. It provides personalized workout plans, nutrition guidance, BMI/calorie calculations, an exercise library, and daily AI motivation — all through a modern React + Flask architecture.

---

## 🚀 Features

| Feature | Description |
|---|---|
| 🤖 **AI Fitness Coach** | Chat with IBM Granite AI for personalized coaching, advice, and motivation |
| 🏋️ **Workout Planner** | Generate custom home/gym workout plans for any goal and fitness level |
| 🥗 **Nutrition Guidance** | AI-generated meal plans with calorie counts and macro breakdowns |
| ⚖️ **BMI Calculator** | Instant BMI calculation with visual gauge and ideal weight range |
| 🔥 **Calorie Calculator** | TDEE, BMR, and macro targets using Harris-Benedict formula |
| 📚 **Exercise Library** | 50+ exercises with AI-powered form guides and progressions |
| 📊 **Progress Dashboard** | Track weight, calories, workouts — visualize trends with charts |
| 🌙 **Dark Mode** | Full dark/light mode toggle with system preference detection |
| 📱 **Mobile Responsive** | Beautiful responsive UI for all screen sizes |

---

## 🗂️ Project Structure

```
FitAI/
├── backend/
│   ├── app.py              # Flask app — all API endpoints + IBM Watsonx.ai client
│   ├── requirements.txt    # Python dependencies
│   ├── .env.example        # Environment variable template
│   └── render.yaml         # Render deployment config
│
└── frontend/
    ├── src/
    │   ├── App.jsx                        # React Router setup
    │   ├── main.jsx                       # React entry point
    │   ├── index.css                      # Tailwind CSS + custom styles
    │   ├── context/
    │   │   └── AppContext.jsx             # Global state (dark mode, profile, progress)
    │   ├── services/
    │   │   └── api.js                     # Axios API service layer
    │   ├── components/
    │   │   ├── Layout.jsx                 # Navbar + footer layout
    │   │   ├── PageLoader.jsx             # Suspense fallback loader
    │   │   ├── AIResponseCard.jsx         # AI response renderer
    │   │   └── UserProfileModal.jsx       # Profile input modal
    │   └── pages/
    │       ├── Landing.jsx                # Professional landing page
    │       ├── Chat.jsx                   # AI Fitness Coach chat
    │       ├── WorkoutPlanner.jsx         # Workout plan generator
    │       ├── Nutrition.jsx              # Nutrition & meal plan page
    │       ├── BMICalculator.jsx          # BMI calculator with gauge
    │       ├── CalorieCalc.jsx            # TDEE + macro calculator
    │       ├── ExerciseLib.jsx            # Exercise library with AI guides
    │       ├── Dashboard.jsx              # Progress dashboard with charts
    │       └── NotFound.jsx               # 404 page
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── vercel.json                        # Vercel deployment config
    └── .env.example
```

---

## ⚙️ Customizing the AI Coach

The AI's personality, coaching style, and safety rules are controlled by the `AGENT_INSTRUCTIONS` dictionary at the top of [`backend/app.py`](backend/app.py).

You can edit it to change:

```python
AGENT_INSTRUCTIONS = {
    "agent_name": "FitAI Coach",          # Change the AI's name
    "tone": "energetic, motivational",    # Change tone: friendly / clinical / motivational
    "fitness_specializations": {
        "weight_loss": True,              # Enable/disable coaching areas
        "yoga_flexibility": False,        # Set to False to disable
    },
    "safety_rules": {
        "safe_weight_loss_rate_kg_per_week": 0.5,  # Adjust safety thresholds
    },
    # ... etc.
}
```

---

## 🛠️ Local Development Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- IBM Cloud account with Watsonx.ai project

### 1. Backend Setup

```bash
cd FitAI/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Linux/Mac
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env          # Windows
cp .env.example .env            # Linux/Mac
# Edit .env and add your IBM credentials

# Start the Flask server
python app.py
# → Running on http://localhost:5000
```

### 2. Frontend Setup

```bash
cd FitAI/frontend

# Install dependencies
npm install

# Configure environment (optional — dev uses Vite proxy)
copy .env.example .env.local    # Windows
cp .env.example .env.local      # Linux/Mac

# Start the dev server
npm run dev
# → Running on http://localhost:5173
```

### 3. Get Your IBM Credentials

1. **IBM API Key**: [IBM Cloud → Manage → Access (IAM) → API keys](https://cloud.ibm.com/iam/apikeys)
2. **Project ID**: [watsonx.ai → your project → Manage → General → Project ID](https://dataplatform.cloud.ibm.com)
3. **URL**: Must match the region your Watson Machine Learning instance is provisioned in

Add these to `backend/.env`:
```env
IBM_API_KEY=your_api_key_here
IBM_PROJECT_ID=your_project_id_here

# Sydney region:
IBM_URL=https://eu-de.ml.cloud.ibm.com
WATSONX_MODEL_ID=ibm/granite-4-h-small

# Dallas/US South region:
# IBM_URL=https://us-south.ml.cloud.ibm.com
# WATSONX_MODEL_ID=ibm/granite-3-2-8b-instruct
```

> ⚠️ **Region matters**: Models available differ by region. Using a model ID that is not
> available in your region will produce a `404 model_not_supported` error regardless of
> whether your API key and project ID are valid.

### 4. Test the Connection

```bash
# With the backend running, visit:
http://localhost:5000/api/debug
# Should return: "✅ ALL CHECKS PASSED"
```

---

## 🚀 Deployment

### Backend → Render (Free Tier)

1. Push your code to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Connect your GitHub repo → select `FitAI/backend` as root directory
4. Set environment variables:
   - `IBM_API_KEY` → your IBM API key
   - `IBM_PROJECT_ID` → your Watsonx.ai project ID
   - `IBM_URL` → your region URL
   - `WATSONX_DEBUG` → `false`
   - `FLASK_DEBUG` → `false`
5. Build command: `pip install -r requirements.txt`
6. Start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Connect your GitHub repo → select `FitAI/frontend` as root directory
3. Framework preset: **Vite**
4. Add environment variable:
   - `VITE_API_URL` → your Render backend URL (e.g., `https://fitai-backend.onrender.com`)
5. Deploy!

---

## 🔌 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET  | `/api/health`    | Health check and model info |
| POST | `/api/chat`      | AI Fitness Coach chat |
| POST | `/api/workout-plan` | Generate workout plan |
| POST | `/api/nutrition` | Generate meal plan |
| POST | `/api/bmi`       | Calculate BMI |
| POST | `/api/calories`  | Calculate TDEE + macros |
| GET  | `/api/motivation`| Daily motivation quote |
| POST | `/api/exercise`  | Exercise detail guide |
| POST | `/api/recovery`  | Recovery advice |
| GET  | `/api/debug`     | Watsonx.ai connection test |

### Example: Chat Request
```json
POST /api/chat
{
  "message": "Create a 4-week beginner home workout plan",
  "history": [],
  "user_profile": {
    "name": "Alex",
    "age": 28,
    "gender": "male",
    "height": 175,
    "weight": 80,
    "goal": "Weight Loss",
    "level": "Beginner",
    "equipment": "No Equipment"
  }
}
```

---

## 🤖 Model Selection by Region

Model availability is **region-specific**. Always use a model ID that is available in your IBM URL region.

### Frankfurt — `eu-de` (`https://eu-de.ml.cloud.ibm.com`)

| Model ID | Type | Use Case |
|---|---|---|
| `ibm/granite-4-h-small` | ✅ **IBM Granite — Chat/Generation** | **Recommended** — only Granite model with text generation in eu-de |
| `ibm/granite-3-1-8b-base` | Base only | Does NOT support text generation endpoint |

### Dallas — `us-south` (`https://us-south.ml.cloud.ibm.com`)

| Model ID | Type | Use Case |
|---|---|---|
| `ibm/granite-3-2-8b-instruct` | ✅ Chat/Instruct | Recommended compact Granite |
| `ibm/granite-3-2-2b-instruct` | Chat/Instruct | Lighter variant |

Set `WATSONX_MODEL_ID` in your `.env` to override:

```env
# eu-de (Frankfurt) — IBM Granite recommended:
WATSONX_MODEL_ID=ibm/granite-4-h-small

# us-south (Dallas) — IBM Granite recommended:
# WATSONX_MODEL_ID=ibm/granite-3-2-8b-instruct
```

---

## 🔒 Security Notes

- **Never commit `.env`** files — they contain your IBM API key
- In production, set `ALLOWED_ORIGINS` to your specific frontend URL
- Set `WATSONX_DEBUG=false` in production to suppress sensitive logs
- Remove or protect the `/api/debug` endpoint in production
- `FLASK_SECRET_KEY` should be a long random string in production

---

## 📦 Tech Stack

| Layer | Technology |
|---|---|
| AI | IBM Watsonx.ai + IBM Granite Foundation Models |
| Backend | Python Flask 3.1, Flask-CORS, python-dotenv |
| Frontend | React 18, Vite, Tailwind CSS 3, React Router 6 |
| HTTP Client | Axios |
| Charts | Recharts |
| Icons | Lucide React |
| Deployment | Render (backend) + Vercel (frontend) |

---

## 📄 License

MIT License — Free to use and modify for personal and commercial projects.

---

*Built with [IBM Bob](https://www.ibm.com/products/watsonx-ai) · Powered by IBM Watsonx.ai & IBM Granite Foundation Models*
