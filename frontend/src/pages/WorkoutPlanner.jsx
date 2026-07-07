/**
 * Workout Planner — generate personalized workout plans via IBM Granite AI.
 */

import React, { useState } from 'react'
import { Dumbbell, RefreshCw, Download, User, Zap } from 'lucide-react'
import { generateWorkoutPlan } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import AIResponseCard from '../components/AIResponseCard.jsx'
import UserProfileModal from '../components/UserProfileModal.jsx'
import toast from 'react-hot-toast'

const GOALS     = ['Weight Loss', 'Muscle Gain', 'General Fitness', 'Strength', 'Endurance', 'Flexibility']
const LEVELS    = ['Beginner', 'Intermediate', 'Advanced']
const LOCATIONS = ['Home', 'Gym', 'Outdoor']
const EQUIPMENT = ['No Equipment', 'Resistance Bands', 'Dumbbells Only', 'Barbell + Dumbbells', 'Full Gym']
const FOCUS     = ['Full Body', 'Upper Body', 'Lower Body', 'Core & Abs', 'Push / Pull / Legs', 'Cardio Only']

export default function WorkoutPlanner() {
  const { userProfile } = useApp()
  const [form, setForm] = useState({
    goal: 'General Fitness', level: 'Beginner',
    location: 'Home', equipment: 'No Equipment',
    days_per_week: 3, duration_weeks: 4, focus: 'Full Body',
  })
  const [result, setResult]     = useState(null)
  const [loading, setLoading]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)

  const handleChange = (e) => {
    const value = e.target.type === 'range' || e.target.type === 'number'
      ? Number(e.target.value)
      : e.target.value
    setForm((f) => ({ ...f, [e.target.name]: value }))
  }

  const handleGenerate = async () => {
    setLoading(true)
    setResult(null)
    try {
      const { data } = await generateWorkoutPlan({ ...form, user_profile: userProfile || {} })
      setResult(data)
      toast.success('Workout plan generated! 💪')
    } catch (err) {
      toast.error(`Failed: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const blob = new Blob([result.plan], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `FitAI_Workout_${form.goal.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-accent-500 rounded-xl flex items-center justify-center">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <h1 className="section-title">Workout Planner</h1>
        </div>
        <p className="section-subtitle ml-13">
          Generate a custom workout plan tailored to your goal, fitness level, and available equipment.
        </p>
      </div>

      {/* Config card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-gray-900 dark:text-white">Customize Your Plan</h2>
          <button onClick={() => setShowProfile(true)} className="btn-secondary text-xs px-3 py-1.5">
            <User className="w-3.5 h-3.5" />
            {userProfile?.name ? `${userProfile.name}'s profile` : 'Set Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fitness Goal</label>
            <select name="goal" value={form.goal} onChange={handleChange} className="select-field">
              {GOALS.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fitness Level</label>
            <select name="level" value={form.level} onChange={handleChange} className="select-field">
              {LEVELS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Training Location</label>
            <select name="location" value={form.location} onChange={handleChange} className="select-field">
              {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Available Equipment</label>
            <select name="equipment" value={form.equipment} onChange={handleChange} className="select-field">
              {EQUIPMENT.map((e) => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Focus Area</label>
            <select name="focus" value={form.focus} onChange={handleChange} className="select-field">
              {FOCUS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Days per Week: <span className="text-brand-600 dark:text-brand-400 font-bold">{form.days_per_week}</span>
            </label>
            <input name="days_per_week" type="range" min={2} max={6} value={form.days_per_week} onChange={handleChange} className="w-full accent-brand-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>2</span><span>6</span></div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Program Duration: <span className="text-brand-600 dark:text-brand-400 font-bold">{form.duration_weeks} weeks</span>
            </label>
            <input name="duration_weeks" type="range" min={2} max={12} value={form.duration_weeks} onChange={handleChange} className="w-full accent-brand-500" />
            <div className="flex justify-between text-xs text-gray-400 mt-1"><span>2 wks</span><span>12 wks</span></div>
          </div>
        </div>

        <button onClick={handleGenerate} disabled={loading} className="btn-primary w-full mt-5 justify-center py-3 disabled:opacity-60">
          {loading ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Plan…</>
          ) : (
            <><Zap className="w-4 h-4" /> Generate My Workout Plan</>
          )}
        </button>
      </div>

      {/* AI Result */}
      {loading && (
        <div className="card p-6 text-center text-gray-500 dark:text-gray-400 animate-pulse">
          <Dumbbell className="w-8 h-8 mx-auto mb-3 text-brand-400 animate-bounce" />
          <p className="font-medium">IBM Granite AI is building your plan…</p>
          <p className="text-sm mt-1">This may take 15–30 seconds</p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 dark:text-white">Your {form.duration_weeks}-Week Plan</h2>
            <button onClick={handleDownload} className="btn-secondary text-xs px-3 py-1.5">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          </div>
          <AIResponseCard content={result.plan} timestamp={result.timestamp} />
        </div>
      )}

      {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  )
}
