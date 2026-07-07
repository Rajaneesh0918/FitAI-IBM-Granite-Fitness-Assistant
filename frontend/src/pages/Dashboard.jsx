/**
 * Progress Dashboard — track fitness metrics and visualize progress over time.
 */

import React, { useState } from 'react'
import {
  BarChart3, Plus, Trash2, TrendingUp, Award, RefreshCw,
  Droplets, Zap, Target,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { getDailyMotivation } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import toast from 'react-hot-toast'

const BADGES = [
  { id: 'first_log',   icon: '🎯', label: 'First Log',       desc: 'Logged your first entry' },
  { id: 'week_streak', icon: '🔥', label: '7-Day Streak',    desc: 'Logged 7 days in a row' },
  { id: 'goal_weight', icon: '⚡', label: 'Goal Weight',     desc: 'Reached target weight' },
  { id: 'hydrated',    icon: '💧', label: 'Stay Hydrated',   desc: 'Met water goal 5 days' },
]

export default function Dashboard() {
  const { progressData, addProgressEntry } = useApp()
  const [form, setForm]     = useState({ weight: '', calories: '', water: '', workout: '', notes: '' })
  const [motivation, setMotivation] = useState(null)
  const [loadingMotivation, setLoadingMotivation] = useState(false)
  const [showAdd, setShowAdd] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleAddEntry = () => {
    if (!form.weight && !form.calories && !form.workout) {
      return toast.error('Add at least one metric (weight, calories, or workout).')
    }
    addProgressEntry({
      weight:   parseFloat(form.weight)   || null,
      calories: parseInt(form.calories)   || null,
      water:    parseFloat(form.water)    || null,
      workout:  form.workout              || null,
      notes:    form.notes               || null,
    })
    setForm({ weight: '', calories: '', water: '', workout: '', notes: '' })
    setShowAdd(false)
    toast.success('Progress logged! Keep it up 💪')
  }

  const fetchMotivation = async () => {
    setLoadingMotivation(true)
    try {
      const { data } = await getDailyMotivation('motivated', 'fitness')
      setMotivation(data.motivation)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoadingMotivation(false)
    }
  }

  // Format chart data
  const chartData = progressData.slice(-14).map((entry, i) => ({
    day:      `Day ${progressData.length - 14 + i + 1}`,
    weight:   entry.weight,
    calories: entry.calories,
    water:    entry.water,
    date:     new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  const hasWeightData = progressData.some((e) => e.weight)
  const hasCalsData   = progressData.some((e) => e.calories)

  // Stats
  const totalWorkouts = progressData.filter((e) => e.workout).length
  const avgWeight     = progressData.filter((e) => e.weight).length
    ? (progressData.filter((e) => e.weight).reduce((s, e) => s + e.weight, 0) / progressData.filter((e) => e.weight).length).toFixed(1)
    : null
  const latestWeight  = progressData.filter((e) => e.weight).slice(-1)[0]?.weight || null

  const earnedBadges = [
    progressData.length > 0   && 'first_log',
    totalWorkouts >= 7        && 'week_streak',
  ].filter(Boolean)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h1 className="section-title">Progress Dashboard</h1>
          </div>
          <p className="section-subtitle">Track your fitness journey and celebrate milestones.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="btn-primary self-start sm:self-auto">
          <Plus className="w-4 h-4" /> Log Today
        </button>
      </div>

      {/* Add entry form */}
      {showAdd && (
        <div className="card p-5 mb-6 animate-slide-up">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Log Today's Progress</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Weight (kg)</label>
              <input name="weight" value={form.weight} onChange={handleChange} type="number" placeholder="70.5" step="0.1" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Calories eaten</label>
              <input name="calories" value={form.calories} onChange={handleChange} type="number" placeholder="2000" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Water (L)</label>
              <input name="water" value={form.water} onChange={handleChange} type="number" placeholder="2.5" step="0.1" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Workout done</label>
              <input name="workout" value={form.workout} onChange={handleChange} placeholder="e.g. Push Day" className="input-field" />
            </div>
          </div>
          <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes (optional)" className="input-field mb-3" />
          <div className="flex gap-3">
            <button onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleAddEntry} className="btn-primary flex-1 justify-center">
              <Plus className="w-4 h-4" /> Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: TrendingUp, label: 'Entries Logged', value: progressData.length, color: 'text-brand-600 dark:text-brand-400' },
          { icon: Zap,         label: 'Workouts Done',   value: totalWorkouts,         color: 'text-orange-500' },
          { icon: Target,      label: 'Latest Weight',   value: latestWeight ? `${latestWeight} kg` : '—', color: 'text-purple-500' },
          { icon: Droplets,    label: 'Avg Weight',      value: avgWeight ? `${avgWeight} kg` : '—', color: 'text-blue-500' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-4 text-center">
            <Icon className={`w-6 h-6 mx-auto mb-1.5 ${color}`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      {progressData.length > 1 ? (
        <div className="grid md:grid-cols-2 gap-5 mb-6">
          {hasWeightData && (
            <div className="card p-5">
              <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-4">Weight Trend (kg)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                  <Tooltip />
                  <Area type="monotone" dataKey="weight" stroke="#22c55e" fill="url(#wGrad)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          {hasCalsData && (
            <div className="card p-5">
              <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-4">Calorie Intake (kcal)</h3>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-8 text-center text-gray-400 dark:text-gray-500 mb-6">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Start logging to see your progress charts</p>
          <p className="text-sm mt-1">Log at least 2 entries to see trends</p>
        </div>
      )}

      {/* Badges */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-yellow-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">Achievements</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BADGES.map(({ id, icon, label, desc }) => {
            const earned = earnedBadges.includes(id)
            return (
              <div
                key={id}
                className={`rounded-xl p-3 text-center transition-all
                  ${earned
                    ? 'bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-gray-50 dark:bg-gray-800 opacity-40 grayscale'
                  }`}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Daily Motivation */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-500" />
            <h2 className="font-bold text-gray-900 dark:text-white">Daily Motivation</h2>
          </div>
          <button onClick={fetchMotivation} disabled={loadingMotivation} className="btn-secondary text-xs px-3 py-1.5 disabled:opacity-60">
            {loadingMotivation ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            {motivation ? 'Refresh' : 'Get Motivated'}
          </button>
        </div>
        {motivation ? (
          <div className="bg-gradient-to-r from-brand-50 to-accent-50 dark:from-brand-950 dark:to-accent-950 border border-brand-200 dark:border-brand-800 rounded-xl p-4 animate-fade-in">
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">"{motivation}"</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">— FitAI Coach (IBM Granite)</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500">Click "Get Motivated" for your daily AI-powered fitness motivation.</p>
        )}
      </div>

      {/* Recent log */}
      {progressData.length > 0 && (
        <div className="card p-5 mt-5">
          <h2 className="font-bold text-gray-900 dark:text-white mb-4">Recent Log</h2>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...progressData].reverse().slice(0, 10).map((entry, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0 text-sm">
                <div className="text-gray-500 dark:text-gray-400 text-xs">
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
                <div className="flex gap-3 text-xs text-gray-600 dark:text-gray-400">
                  {entry.weight    && <span>⚖️ {entry.weight} kg</span>}
                  {entry.calories  && <span>🔥 {entry.calories} kcal</span>}
                  {entry.water     && <span>💧 {entry.water} L</span>}
                  {entry.workout   && <span>💪 {entry.workout}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
