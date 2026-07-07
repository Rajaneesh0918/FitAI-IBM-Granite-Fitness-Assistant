/**
 * FitAI API Service
 * Centralizes all HTTP calls to the Flask backend.
 * Backend URL is read from VITE_API_URL env variable (falls back to '' for Vite proxy).
 */

import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 min — Watsonx can be slow on first call
  headers: { 'Content-Type': 'application/json' },
})

// ── Response interceptor — normalize errors ──────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  }
)

// ── Chat ─────────────────────────────────────────────────────────────────
export const sendChatMessage = (message, history = [], userProfile = {}) =>
  api.post('/api/chat', { message, history, user_profile: userProfile })

// ── Workout Plan ─────────────────────────────────────────────────────────
export const generateWorkoutPlan = (params) =>
  api.post('/api/workout-plan', params)

// ── Nutrition Guidance ───────────────────────────────────────────────────
export const getNutritionGuidance = (params) =>
  api.post('/api/nutrition', params)

// ── BMI Calculator ───────────────────────────────────────────────────────
export const calculateBMI = (weight, height) =>
  api.post('/api/bmi', { weight, height })

// ── Calorie / TDEE Calculator ────────────────────────────────────────────
export const calculateCalories = (params) =>
  api.post('/api/calories', params)

// ── Daily Motivation ─────────────────────────────────────────────────────
export const getDailyMotivation = (mood = 'energized', goal = 'fitness') =>
  api.get('/api/motivation', { params: { mood, goal } })

// ── Exercise Info ────────────────────────────────────────────────────────
export const getExerciseInfo = (exercise, level = 'beginner') =>
  api.post('/api/exercise', { exercise, level })

// ── Recovery Advice ──────────────────────────────────────────────────────
export const getRecoveryAdvice = (activity, soreness = 'moderate') =>
  api.post('/api/recovery', { activity, soreness })

// ── Health Check ─────────────────────────────────────────────────────────
export const healthCheck = () => api.get('/api/health')

export default api
