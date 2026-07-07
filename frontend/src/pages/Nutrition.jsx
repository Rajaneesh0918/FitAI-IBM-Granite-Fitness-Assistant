/**
 * Nutrition Page — AI-powered meal plans and nutrition guidance.
 */

import React, { useState } from 'react'
import { Salad, RefreshCw, Download, Zap } from 'lucide-react'
import { getNutritionGuidance } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import AIResponseCard from '../components/AIResponseCard.jsx'
import toast from 'react-hot-toast'

const GOALS      = ['Weight Loss', 'Muscle Gain', 'Weight Gain', 'Maintenance', 'Heart Health', 'Diabetes Management']
const DIET_TYPES = ['Balanced', 'Vegetarian', 'Vegan', 'Keto / Low-Carb', 'High-Protein', 'Mediterranean', 'Paleo']
const DURATIONS  = ['1-day', '3-day', '7-day', '14-day']

export default function Nutrition() {
  const { userProfile } = useApp()
  const [form, setForm] = useState({
    goal: 'Weight Loss', calories: 2000,
    diet_type: 'Balanced', duration: '7-day',
  })
  const [result, setResult]   = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const value = e.target.type === 'number' ? Number(e.target.value) : e.target.value
    setForm((f) => ({ ...f, [e.target.name]: value }))
  }

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const { data } = await getNutritionGuidance({ ...form, user_profile: userProfile || {} })
      setResult(data)
      toast.success('Meal plan generated! 🥗')
    } catch (err) {
      toast.error(`Failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result.guidance], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `FitAI_MealPlan_${form.goal.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center">
            <Salad className="w-6 h-6 text-white" />
          </div>
          <h1 className="section-title">Nutrition Guidance</h1>
        </div>
        <p className="section-subtitle">
          Get AI-generated meal plans, macro breakdowns, and nutrition advice tailored to your goals.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-5">Configure Your Meal Plan</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nutrition Goal</label>
            <select name="goal" value={form.goal} onChange={handleChange} className="select-field">
              {GOALS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Diet Type</label>
            <select name="diet_type" value={form.diet_type} onChange={handleChange} className="select-field">
              {DIET_TYPES.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Daily Calories Target: <span className="text-brand-600 dark:text-brand-400 font-bold">{form.calories} kcal</span>
            </label>
            <input name="calories" type="range" min={1200} max={4000} step={50} value={form.calories} onChange={handleChange} className="w-full accent-brand-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>1200</span><span>4000</span></div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Plan Duration</label>
            <select name="duration" value={form.duration} onChange={handleChange} className="select-field">
              {DURATIONS.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full mt-5 justify-center py-3 disabled:opacity-60">
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Meal Plan…</>
            : <><Zap className="w-4 h-4" /> Generate My Meal Plan</>
          }
        </button>
      </div>

      {loading && (
        <div className="card p-6 text-center text-gray-500 dark:text-gray-400 animate-pulse">
          <Salad className="w-8 h-8 mx-auto mb-3 text-teal-400 animate-bounce" />
          <p className="font-medium">IBM Granite AI is crafting your nutrition plan…</p>
          <p className="text-sm mt-1">This may take 15–30 seconds</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white">Your {form.duration} Meal Plan</h2>
            <button onClick={handleDownload} className="btn-secondary text-xs px-3 py-1.5">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
          <AIResponseCard content={result.guidance} timestamp={result.timestamp} />
        </div>
      )}
    </div>
  )
}
