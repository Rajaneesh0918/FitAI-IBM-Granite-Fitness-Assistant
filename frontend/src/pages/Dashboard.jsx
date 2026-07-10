/**
 * Progress Dashboard — track fitness metrics and visualize progress over time.
 * Polish pass: BMI validation, premium charts, card hover states, avatar,
 * improved empty states, greeting, Quick Actions, responsive refinements.
 * All business logic, state, API calls, and routing are unchanged.
 */

import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3, Plus, RefreshCw,
  Droplets, Zap, Target, User, ChevronRight,
  Flame, Dumbbell, Scale, Activity, MessageSquare,
  CalendarDays, CheckCircle2, Info, ArrowRight,
  BookOpen, Salad, AlertTriangle, Sparkles, Trophy, CalendarRange,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
} from 'recharts'
import { getDailyMotivation } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import toast from 'react-hot-toast'

// ── Greeting helper ───────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// ── Greeting sub-text (goal-aware) ────────────────────────────────────────
function getSubText(userProfile) {
  if (userProfile?.goal) {
    const goalMap = {
      'Weight Loss':       'Every healthy choice gets you closer to your weight loss goal.',
      'Weight Gain':       'Stay consistent — your weight gain journey is on track.',
      'Muscle Gain':       'Ready to build strength? Let\'s make today count.',
      'General Fitness':   'Ready to achieve your fitness goals today?',
      'Endurance':         'Push a little further — your endurance is growing.',
      'Flexibility':       'Move freely, move well. A great day to stretch!',
    }
    return goalMap[userProfile.goal] ?? 'Ready to achieve your fitness goals today?'
  }
  return 'Track, improve, and celebrate your fitness journey.'
}

// ── Thin animated progress bar ────────────────────────────────────────────
function ProgressBar({ value, max, color = 'bg-brand-500' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

// ── Premium Recharts tooltip ──────────────────────────────────────────────
function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 shadow-card-lg text-xs pointer-events-none"
      style={{ minWidth: 130 }}
    >
      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: p.color }}
            />
            <span className="text-gray-500 dark:text-gray-400">{p.name}</span>
          </div>
          <span className="font-bold tabular-nums" style={{ color: p.color }}>
            {p.value != null ? p.value : '—'}
            {unit ? ` ${unit}` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}

function AnalyticsMetric({ icon: Icon, color, bg, label, value, detail, percent }) {
  return <div className="premium-stat-card"><div className="flex items-center justify-between"><span className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}><Icon className="h-4 w-4" /></span><span className="text-xs font-bold text-gray-900">{value}</span></div><p className="mt-3 text-xs font-bold text-gray-700">{label}</p><p className="mt-1 text-[11px] text-gray-500">{detail}</p><ProgressBar value={percent} max={100} color={color.replace('text-', 'bg-')} /></div>
}

function GoalRow({ label, value, detail, percent, color }) {
  return <div className="rounded-2xl border border-gray-100 bg-white p-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-gray-800">{label}</p><p className="text-xs font-bold text-gray-600">{value}</p></div><p className="mt-1 text-[11px] text-gray-500">{detail}</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} /></div></div>
}

function RecordCard({ icon: Icon, color, bg, title, value }) {
  return <div className="premium-stat-card"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${bg} ${color}`}><Icon className="h-4 w-4" /></div><p className="mt-3 text-xs font-bold text-gray-900">{value}</p><p className="mt-1 text-[11px] text-gray-500">{title}</p></div>
}

function InsightRow({ icon: Icon, color, bg, text }) {
  return <div className="flex items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${bg} ${color}`}><Icon className="h-4 w-4" /></span><p className="text-xs leading-5 text-gray-600">{text}</p></div>
}

// ── BMI calculation with full validation ─────────────────────────────────
// Returns { bmi: string, error: string|null }
function calcBMI(profile) {
  if (!profile?.height || !profile?.weight) return { bmi: null, error: null }

  const hRaw = parseFloat(profile.height)
  const w    = parseFloat(profile.weight)

  if (isNaN(hRaw) || isNaN(w)) return { bmi: null, error: null }

  // Detect unit: if height looks like metres (e.g. 1.75) treat as cm*100
  // Valid cm range: 100 – 250. Values < 3 treated as metres and converted.
  let hCm = hRaw
  if (hRaw > 0 && hRaw < 3) {
    // Looks like metres (e.g. 1.75) — convert to cm
    hCm = hRaw * 100
  }

  if (hCm < 100 || hCm > 250) {
    return {
      bmi: null,
      error: `Height ${hRaw} looks incorrect. Please enter height in cm (e.g. 175).`,
    }
  }
  if (w < 20 || w > 500) {
    return {
      bmi: null,
      error: `Weight ${w} kg looks incorrect. Please check your profile.`,
    }
  }

  const h = hCm / 100
  const result = (w / (h * h)).toFixed(1)

  // Final sanity: BMI outside 10-80 is physiologically impossible
  if (parseFloat(result) < 10 || parseFloat(result) > 80) {
    return { bmi: null, error: 'Could not compute BMI. Please verify your height and weight in your profile.' }
  }

  return { bmi: result, error: null }
}

function bmiRiskLevel(bmi) {
  if (!bmi) return null
  const b = parseFloat(bmi)
  if (b < 18.5) return { label: 'Underweight', color: 'text-sky-600',     bg: 'bg-sky-50 dark:bg-sky-950/80',     border: 'border-sky-200 dark:border-sky-800',     dot: 'bg-sky-500'     }
  if (b < 25)   return { label: 'Healthy',     color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/80', border: 'border-emerald-200 dark:border-emerald-800', dot: 'bg-emerald-500' }
  if (b < 30)   return { label: 'Overweight',  color: 'text-orange-600',  bg: 'bg-orange-50 dark:bg-orange-950/80', border: 'border-orange-200 dark:border-orange-800', dot: 'bg-orange-500'  }
  return               { label: 'High BMI',    color: 'text-red-600',     bg: 'bg-red-50 dark:bg-red-950/80',     border: 'border-red-200 dark:border-red-800',     dot: 'bg-red-500'     }
}

// ── Daily water goal: 35 ml / kg body weight ─────────────────────────────
function waterGoalFromWeight(weight) {
  if (!weight) return 2.5
  const w = parseFloat(weight)
  if (isNaN(w) || w <= 0) return 2.5
  return Math.round(w * 0.035 * 10) / 10
}

// ── Build recommendations from real data only ─────────────────────────────
function buildRecommendations({ userProfile, latestWater, latestCalories, totalWorkouts, progressData }) {
  const recs = []
  const waterGoal = waterGoalFromWeight(userProfile?.weight)

  if (!latestWater || latestWater < waterGoal) {
    recs.push({
      icon: Droplets,
      color: 'text-sky-500', iconBg: 'bg-sky-100 dark:bg-sky-900',
      bg:   'bg-sky-50 dark:bg-sky-950/50',
      border: 'border-sky-100 dark:border-sky-900',
      title: 'Hydration',
      text: latestWater
        ? `You logged ${latestWater} L today — your goal is ${waterGoal} L. Keep drinking!`
        : `Your daily water goal is ~${waterGoal} L based on your weight. Start tracking.`,
      link: null,
    })
  }

  if (!latestCalories) {
    recs.push({
      icon: Flame,
      color: 'text-orange-500', iconBg: 'bg-orange-100 dark:bg-orange-900',
      bg:   'bg-orange-50 dark:bg-orange-950/50',
      border: 'border-orange-100 dark:border-orange-900',
      title: 'Nutrition',
      text: 'Log your calorie intake to track your daily nutrition progress.',
      link: '/nutrition',
    })
  }

  if (totalWorkouts === 0) {
    recs.push({
      icon: Dumbbell,
      color: 'text-purple-500', iconBg: 'bg-purple-100 dark:bg-purple-900',
      bg:   'bg-purple-50 dark:bg-purple-950/50',
      border: 'border-purple-100 dark:border-purple-900',
      title: 'Workout',
      text: 'No workouts logged yet. Get a personalised workout plan from the AI planner.',
      link: '/workout',
    })
  } else if (totalWorkouts < 3) {
    recs.push({
      icon: Dumbbell,
      color: 'text-purple-500', iconBg: 'bg-purple-100 dark:bg-purple-900',
      bg:   'bg-purple-50 dark:bg-purple-950/50',
      border: 'border-purple-100 dark:border-purple-900',
      title: 'Workout',
      text: `${totalWorkouts} workout${totalWorkouts > 1 ? 's' : ''} logged — aim for 3+ sessions a week for best results.`,
      link: '/workout',
    })
  }

  if (userProfile?.goal) {
    recs.push({
      icon: Target,
      color: 'text-emerald-600', iconBg: 'bg-emerald-100 dark:bg-emerald-900',
      bg:   'bg-emerald-50 dark:bg-emerald-950/50',
      border: 'border-emerald-100 dark:border-emerald-900',
      title: 'Your Goal',
      text: `Goal: ${userProfile.goal}. Use the AI Coach to build a tailored daily plan.`,
      link: '/chat',
    })
  }

  if (progressData.length === 0) {
    recs.push({
      icon: BarChart3,
      color: 'text-brand-500', iconBg: 'bg-brand-100 dark:bg-brand-900',
      bg:   'bg-brand-50 dark:bg-brand-950/50',
      border: 'border-brand-100 dark:border-brand-900',
      title: 'Start Logging',
      text: 'Log your first entry to unlock progress charts and personalised insights.',
      link: null,
    })
  }

  if (!userProfile) {
    recs.push({
      icon: User,
      color: 'text-gray-500', iconBg: 'bg-gray-100 dark:bg-gray-800',
      bg:   'bg-gray-50 dark:bg-gray-800/50',
      border: 'border-gray-100 dark:border-gray-800',
      title: 'Set Up Profile',
      text: 'Add your details so FitAI can personalise every recommendation for you.',
      link: '/chat',
    })
  }

  return recs.slice(0, 4)
}

// ── Generated avatar (SVG-based, no external image) ───────────────────────
function GeneratedAvatar({ name, size = 48 }) {
  const initials  = name
    ? name.trim().split(/\s+/).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : '?'
  // Deterministic hue from name chars
  const hue = name
    ? name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
    : 200
  const bg1 = `hsl(${hue}, 65%, 52%)`
  const bg2 = `hsl(${(hue + 40) % 360}, 70%, 38%)`
  const fontSize = size * 0.36

  return (
    <svg
      width={size} height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="rounded-2xl flex-shrink-0"
      style={{ borderRadius: 12 }}
      aria-label={`Avatar for ${name}`}
    >
      <defs>
        <linearGradient id="avGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="100%" stopColor={bg2} />
        </linearGradient>
        <clipPath id="avClip">
          <rect width={size} height={size} rx="12" ry="12" />
        </clipPath>
      </defs>
      <rect width={size} height={size} rx="12" ry="12" fill="url(#avGrad)" clipPath="url(#avClip)" />
      {/* Subtle inner highlight ring */}
      <rect
        x="1" y="1" width={size - 2} height={size - 2} rx="11" ry="11"
        fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5"
        clipPath="url(#avClip)"
      />
      <text
        x={size / 2} y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize={fontSize}
        fontWeight="700"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
        letterSpacing="-0.5"
      >
        {initials}
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  // ── State — UNCHANGED ─────────────────────────────────────────────────
  const { progressData, addProgressEntry, userProfile } = useApp()
  const [form, setForm]                   = useState({ weight: '', calories: '', water: '', workout: '', notes: '' })
  const [motivation, setMotivation]       = useState(null)
  const [loadingMotivation, setLoadingMotivation] = useState(false)
  const [showAdd, setShowAdd]             = useState(false)

  // ── Handlers — UNCHANGED ──────────────────────────────────────────────
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

  // ── Derived data — UNCHANGED ──────────────────────────────────────────
  const chartData = progressData.slice(-14).map((entry, i) => ({
    day:      `Day ${progressData.length - 14 + i + 1}`,
    weight:   entry.weight,
    calories: entry.calories,
    water:    entry.water,
    date:     new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  }))

  const hasWeightData   = progressData.some((e) => e.weight)
  const hasCalsData     = progressData.some((e) => e.calories)
  const hasWaterData    = progressData.some((e) => e.water)
  const totalWorkouts   = progressData.filter((e) => e.workout).length
  const weightEntries   = progressData.filter((e) => e.weight)
  const avgWeight       = weightEntries.length
    ? (weightEntries.reduce((s, e) => s + e.weight, 0) / weightEntries.length).toFixed(1)
    : null
  const latestWeight    = weightEntries.slice(-1)[0]?.weight || null
  const latestCalories  = progressData.filter((e) => e.calories).slice(-1)[0]?.calories || null
  const latestWater     = progressData.filter((e) => e.water).slice(-1)[0]?.water || null

  // Analytics are intentionally derived only from local progress entries.
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now)
  monthStart.setDate(now.getDate() - 29)
  monthStart.setHours(0, 0, 0, 0)
  const datedEntries = progressData.filter((entry) => !Number.isNaN(new Date(entry.date).getTime()))
  const weeklyEntries = datedEntries.filter((entry) => new Date(entry.date) >= weekStart)
  const monthlyEntries = datedEntries.filter((entry) => new Date(entry.date) >= monthStart)
  const weeklyWorkouts = weeklyEntries.filter((entry) => entry.workout).length
  const monthlyWorkouts = monthlyEntries.filter((entry) => entry.workout).length
  const weeklyCalories = weeklyEntries.filter((entry) => entry.calories).map((entry) => entry.calories)
  const weeklyWater = weeklyEntries.filter((entry) => entry.water).map((entry) => entry.water)
  const averageCalories = weeklyCalories.length ? Math.round(weeklyCalories.reduce((sum, value) => sum + value, 0) / weeklyCalories.length) : null
  const averageWater = weeklyWater.length ? Math.round((weeklyWater.reduce((sum, value) => sum + value, 0) / weeklyWater.length) * 10) / 10 : null
  const weightChange = weightEntries.length > 1 ? Math.round((weightEntries.at(-1).weight - weightEntries[0].weight) * 10) / 10 : null
  const waterValues = progressData.filter((entry) => entry.water).map((entry) => entry.water)
  const hydrationChange = waterValues.length >= 2
    ? Math.round(((waterValues.at(-1) - waterValues[0]) / waterValues[0]) * 100)
    : null
  const completedHydrationDays = weeklyWater.filter((value) => value >= waterGoalFromWeight(userProfile?.weight)).length
  const weeklyActivity = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((label, day) => ({
    day: label,
    workouts: weeklyEntries.filter((entry) => entry.workout && new Date(entry.date).getDay() === day).length,
  }))
  const highestCalories = progressData.filter((entry) => entry.calories).reduce((highest, entry) => !highest || entry.calories > highest.calories ? entry : highest, null)
  const bestHydration = progressData.filter((entry) => entry.water).reduce((best, entry) => !best || entry.water > best.water ? entry : best, null)
  const activeWeekCount = monthlyEntries.filter((entry) => entry.workout).length
  const workoutDays = [...new Set(datedEntries.filter((entry) => entry.workout).map((entry) => new Date(entry.date).toDateString()))]
    .map((date) => new Date(date).setHours(0, 0, 0, 0)).sort((a, b) => a - b)
  const longestWorkoutStreak = workoutDays.reduce((streak, day, index) => {
    const previous = workoutDays[index - 1]
    const next = index && day - previous === 86400000 ? streak.current + 1 : 1
    return { current: next, best: Math.max(streak.best, next) }
  }, { current: 0, best: 0 }).best

  const earnedBadges = [
    progressData.length > 0 && 'first_log',
    totalWorkouts >= 7      && 'week_streak',
  ].filter(Boolean)

  // ── Assessment data ───────────────────────────────────────────────────
  const { bmi, error: bmiError } = calcBMI(userProfile)
  const riskInfo    = bmiRiskLevel(bmi)
  const waterGoal   = waterGoalFromWeight(userProfile?.weight)

  const workoutIntensity = userProfile?.level === 'Advanced'
    ? 'High'
    : userProfile?.level === 'Intermediate'
    ? 'Moderate'
    : userProfile?.level === 'Beginner'
    ? 'Low'
    : null

  // ── Recommendations ───────────────────────────────────────────────────
  const recommendations = buildRecommendations({
    userProfile, latestWater, latestCalories, totalWorkouts, progressData,
  })

  // ── Stat card config ──────────────────────────────────────────────────
  const STAT_CARDS = [
    {
      icon:      Flame,
      accent:    'bg-orange-100 dark:bg-orange-950',
      iconColor: 'text-orange-500',
      barColor:  'bg-orange-400',
      label:     'Calories',
      value:     latestCalories ? latestCalories.toLocaleString() : '—',
      unit:      latestCalories ? 'kcal' : '',
      sub:       latestCalories ? 'Last logged entry' : 'No data yet',
      bar:       latestCalories ? { v: latestCalories, max: 2500 } : null,
    },
    {
      icon:      Dumbbell,
      accent:    'bg-purple-100 dark:bg-purple-950',
      iconColor: 'text-purple-500',
      barColor:  'bg-purple-400',
      label:     'Workouts',
      value:     String(totalWorkouts),
      unit:      'sessions',
      sub:       totalWorkouts >= 3 ? '🎉 Great consistency!' : 'Aim for 3 / week',
      bar:       { v: totalWorkouts, max: 30 },
    },
    {
      icon:      Scale,
      accent:    'bg-emerald-100 dark:bg-emerald-950',
      iconColor: 'text-emerald-600',
      barColor:  'bg-emerald-500',
      label:     'Body Weight',
      value:     latestWeight ? String(latestWeight) : '—',
      unit:      latestWeight ? 'kg' : '',
      sub:       avgWeight ? `Avg: ${avgWeight} kg` : 'No entries yet',
      bar:       null,
    },
    {
      icon:      Droplets,
      accent:    'bg-sky-100 dark:bg-sky-950',
      iconColor: 'text-sky-500',
      barColor:  'bg-sky-400',
      label:     'Hydration',
      value:     latestWater ? String(latestWater) : '—',
      unit:      latestWater ? `/ ${waterGoal} L` : '',
      sub:       latestWater && latestWater >= waterGoal ? '✓ Daily goal met' : `Goal: ${waterGoal} L`,
      bar:       latestWater ? { v: latestWater, max: waterGoal } : null,
    },
  ]

  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="premium-page min-h-screen bg-surface-50 dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Greeting header ── */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {getGreeting()}{userProfile?.name ? `, ${userProfile.name}` : ''}! 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
              {getSubText(userProfile)}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="btn-primary self-start sm:self-auto shrink-0"
          >
            <Plus className="w-4 h-4" />
            {showAdd ? 'Cancel Log' : 'Log Today'}
          </button>
        </div>

        {/* ── Log entry form ── */}
        {showAdd && (
          <div className="card p-6 mb-6 animate-slide-up ring-1 ring-brand-100 dark:ring-brand-900">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-sm">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white text-sm">Log Today's Progress</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500">Fill in any metrics you want to track</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {[
                { name: 'weight',   label: 'Body Weight',    placeholder: '70.5',          type: 'number', step: '0.1', icon: '⚖️' },
                { name: 'calories', label: 'Calories eaten', placeholder: '2000',           type: 'number', icon: '🔥' },
                { name: 'water',    label: 'Water (L)',      placeholder: '2.5',            type: 'number', step: '0.1', icon: '💧' },
                { name: 'workout',  label: 'Workout done',   placeholder: 'e.g. Push Day',  type: 'text',   icon: '💪' },
              ].map(({ name, label, placeholder, type, step, icon }) => (
                <div key={name}>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>{icon}</span> {label}
                  </label>
                  <input
                    name={name} value={form[name]} onChange={handleChange}
                    type={type} placeholder={placeholder} step={step}
                    className="input-field"
                  />
                </div>
              ))}
            </div>
            <input
              name="notes" value={form.notes} onChange={handleChange}
              placeholder="Notes (optional) — e.g. felt great, sore legs…"
              className="input-field mb-4"
            />
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setShowAdd(false)} className="btn-secondary sm:flex-1">Cancel</button>
              <button onClick={handleAddEntry} className="btn-primary sm:flex-1 justify-center">
                <Plus className="w-4 h-4" /> Save Entry
              </button>
            </div>
          </div>
        )}

        {/* ── Two-column layout ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

          {/* ════════ LEFT / MAIN COLUMN ════════ */}
          <div className="space-y-6 min-w-0">

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {STAT_CARDS.map(({ icon: Icon, accent, iconColor, barColor, label, value, unit, sub, bar }) => (
                <div
                  key={label}
                  className="card p-4 sm:p-5 flex flex-col gap-3 hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  {/* Icon badge */}
                  <div className={`w-10 h-10 ${accent} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  {/* Value */}
                  <div>
                    <div className="flex items-baseline gap-1 leading-none flex-wrap">
                      <span className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{value}</span>
                      {unit && (
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{unit}</span>
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                  </div>
                  {/* Progress bar */}
                  {bar
                    ? <ProgressBar value={bar.v} max={bar.max} color={barColor} />
                    : <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full" />
                  }
                  {/* Sub label */}
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{sub}</p>
                </div>
              ))}
            </div>

            {/* ── AI Smart Assessment ── */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center shadow-sm">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">AI Smart Assessment</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Based on your profile &amp; logged data</p>
                  </div>
                </div>
                <Link
                  to="/bmi"
                  className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1 transition-colors group"
                >
                  Full BMI
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {userProfile ? (
                <>
                  {/* BMI validation error */}
                  {bmiError && (
                    <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4">
                      <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">{bmiError}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* Risk level */}
                    {riskInfo && (
                      <div className={`rounded-2xl p-4 border ${riskInfo.bg} ${riskInfo.border} transition-all duration-200 hover:shadow-card`}>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Risk Level</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${riskInfo.dot}`} />
                          <p className={`text-sm font-bold ${riskInfo.color}`}>{riskInfo.label}</p>
                        </div>
                      </div>
                    )}

                    {/* BMI */}
                    {bmi && (
                      <div className="bg-surface-50 dark:bg-gray-800/60 border border-surface-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-card transition-all duration-200">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">BMI</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{bmi}</p>
                      </div>
                    )}

                    {/* Workout Intensity */}
                    {workoutIntensity && (
                      <div className="bg-surface-50 dark:bg-gray-800/60 border border-surface-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-card transition-all duration-200">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Workout Intensity</p>
                        <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{workoutIntensity}</p>
                      </div>
                    )}

                    {/* Daily Water Goal */}
                    <div className="bg-surface-50 dark:bg-gray-800/60 border border-surface-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-card transition-all duration-200">
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Daily Water Goal</p>
                      <p className="text-sm font-bold text-sky-600 dark:text-sky-400">{waterGoal} L / day</p>
                    </div>

                    {/* Fitness Goal */}
                    {userProfile.goal && (
                      <div className="bg-surface-50 dark:bg-gray-800/60 border border-surface-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-card transition-all duration-200">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Fitness Goal</p>
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 leading-snug">{userProfile.goal}</p>
                      </div>
                    )}

                    {/* Fitness Level */}
                    {userProfile.level && (
                      <div className="bg-surface-50 dark:bg-gray-800/60 border border-surface-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-card transition-all duration-200">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Fitness Level</p>
                        <p className="text-sm font-bold text-orange-500 dark:text-orange-400">{userProfile.level}</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-surface-50 dark:bg-gray-800/40 border border-surface-200 dark:border-gray-700 rounded-2xl p-5">
                  <div className="w-10 h-10 bg-brand-50 dark:bg-brand-950 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Info className="w-5 h-5 text-brand-500" />
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Profile not set up yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Add your height, weight, goal, and fitness level to see your personalised assessment here.
                    </p>
                  </div>
                  <Link to="/chat" className="btn-primary text-xs px-4 py-2 flex-shrink-0">
                    Set Up Profile
                  </Link>
                </div>
              )}
            </div>

            {/* ── Progress charts ── */}
            {progressData.length > 1 ? (
              <div className="grid md:grid-cols-2 gap-5">

                {/* Weight chart */}
                {hasWeightData && (
                  <div className="card p-5 hover:shadow-card-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-brand-400" />
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Weight Trend</h3>
                      </div>
                      <span className="badge bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900 text-[10px]">
                        kg
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 ml-6">
                      Last {Math.min(14, progressData.length)} entr{progressData.length === 1 ? 'y' : 'ies'}
                    </p>
                    <ResponsiveContainer width="100%" height={190}>
                      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                        <defs>
                          <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#0f62fe" stopOpacity={0.18} />
                            <stop offset="100%" stopColor="#0f62fe" stopOpacity={0}    />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 6" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickLine={false} axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickLine={false} axisLine={false}
                          domain={['auto', 'auto']}
                          width={34}
                        />
                        <Tooltip content={<ChartTooltip unit="kg" />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                        <Area
                          type="monotone" dataKey="weight" name="Weight"
                          stroke="#0f62fe" fill="url(#wGrad)"
                          strokeWidth={3} dot={false}
                          activeDot={{ r: 5, fill: '#0f62fe', stroke: '#fff', strokeWidth: 2.5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-2 mt-3 ml-1">
                      <span className="w-4 h-0.5 bg-brand-500 rounded-full inline-block" />
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">Body weight (kg)</span>
                    </div>
                  </div>
                )}

                {/* Calories chart */}
                {hasCalsData && (
                  <div className="card p-5 hover:shadow-card-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-orange-400" />
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Calorie Intake</h3>
                      </div>
                      <span className="badge bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900 text-[10px]">
                        kcal
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 ml-6">
                      Last {Math.min(14, progressData.length)} entr{progressData.length === 1 ? 'y' : 'ies'}
                    </p>
                    <ResponsiveContainer width="100%" height={190}>
                      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 6" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickLine={false} axisLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickLine={false} axisLine={false}
                          width={40}
                        />
                        <Tooltip content={<ChartTooltip unit="kcal" />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                        <Line
                          type="monotone" dataKey="calories" name="Calories"
                          stroke="#16a34a" strokeWidth={3} dot={false}
                          activeDot={{ r: 5, fill: '#16a34a', stroke: '#fff', strokeWidth: 2.5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-2 mt-3 ml-1">
                      <span className="w-4 h-0.5 bg-emerald-600 rounded-full inline-block" />
                      <span className="text-[11px] text-gray-400 dark:text-gray-500">Daily calories (kcal)</span>
                    </div>
                  </div>
                )}

                {/* Hydration chart */}
                {hasWaterData && (
                  <div className="card p-5 hover:shadow-card-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-sky-500" />
                        <h3 className="font-semibold text-sm text-gray-800 dark:text-gray-200">Water Intake</h3>
                      </div>
                      <span className="badge bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900 text-[10px]">litres</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 ml-6">Last {Math.min(14, progressData.length)} entries</p>
                    <ResponsiveContainer width="100%" height={190}>
                      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 6" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={34} />
                        <Tooltip content={<ChartTooltip unit="L" />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1 }} />
                        <Line type="monotone" dataKey="water" name="Water" stroke="#0ea5e9" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2.5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-2 mt-3 ml-1"><span className="w-4 h-0.5 bg-sky-500 rounded-full inline-block" /><span className="text-[11px] text-gray-400 dark:text-gray-500">Daily water intake (L)</span></div>
                  </div>
                )}

              </div>
            ) : (
              /* Empty charts state */
              <div className="card p-10 sm:p-14 text-center hover:shadow-card-md transition-shadow duration-200">
                <div className="w-16 h-16 bg-surface-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                </div>
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-base">Your progress charts will appear here</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2 mb-5 max-w-xs mx-auto">
                  Log at least 2 entries with weight or calories to see your trend lines.
                </p>
                <button
                  onClick={() => { setShowAdd(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  className="btn-primary mx-auto"
                >
                  <Plus className="w-4 h-4" /> Log Your First Entry
                </button>
              </div>
            )}

            {/* ── Smart Progress Analytics ── */}
            {progressData.length > 0 ? <>
              <div className="card p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-5"><div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-brand-600" /><div><h2 className="font-bold text-gray-900 dark:text-white">Smart Progress Analytics</h2><p className="text-xs text-gray-500">Weekly and monthly insights from your logged data.</p></div></div><span className="badge-blue">7 days</span></div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <AnalyticsMetric icon={Dumbbell} color="text-purple-600" bg="bg-purple-50" label="Workout consistency" value={`${weeklyWorkouts} / 3`} detail={weeklyWorkouts >= 3 ? 'Weekly target reached' : `${3 - weeklyWorkouts} to reach target`} percent={Math.min(100, Math.round(weeklyWorkouts / 3 * 100))} />
                  <AnalyticsMetric icon={Droplets} color="text-sky-600" bg="bg-sky-50" label="Average hydration" value={averageWater ? `${averageWater} L` : '—'} detail={averageWater ? `${completedHydrationDays} day(s) at goal` : 'No weekly water logs'} percent={averageWater ? Math.min(100, Math.round(averageWater / waterGoal * 100)) : 0} />
                  <AnalyticsMetric icon={Flame} color="text-orange-600" bg="bg-orange-50" label="Average calories" value={averageCalories ? `${averageCalories} kcal` : '—'} detail={averageCalories ? 'Weekly calorie logs' : 'No weekly calorie logs'} percent={averageCalories ? Math.min(100, Math.round(averageCalories / 2500 * 100)) : 0} />
                  <AnalyticsMetric icon={Scale} color="text-emerald-600" bg="bg-emerald-50" label="Weight change" value={weightChange == null ? '—' : `${weightChange > 0 ? '+' : ''}${weightChange} kg`} detail={weightChange == null ? 'Need two weight logs' : 'Across all weight logs'} percent={Math.min(100, weightEntries.length * 20)} />
                </div>
                <div className="mt-5 rounded-2xl border border-surface-200 bg-surface-50 p-4"><div className="mb-2 flex items-center justify-between"><p className="text-xs font-bold text-gray-700">Weekly activity summary</p><p className="text-xs text-gray-500">{monthlyEntries.length} logs / last 30 days</p></div><ResponsiveContainer width="100%" height={110}><BarChart data={weeklyActivity} margin={{ top: 4, right: 0, left: -28, bottom: 0 }}><XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} /><Tooltip content={<ChartTooltip unit="workouts" />} /><Bar dataKey="workouts" name="Workouts" fill="#7c3aed" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="card p-5 sm:p-6"><div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-brand-600" /><div><h2 className="font-bold text-gray-900 dark:text-white">Health Insights</h2><p className="text-xs text-gray-500">Based only on your logs.</p></div></div><div className="space-y-3">{weeklyWorkouts > 0 && <InsightRow icon={Dumbbell} color="text-purple-600" bg="bg-purple-50" text={`You've completed ${weeklyWorkouts} workout${weeklyWorkouts === 1 ? '' : 's'} this week.`} />}{hydrationChange != null && <InsightRow icon={Droplets} color="text-sky-600" bg="bg-sky-50" text={`Hydration is ${hydrationChange >= 0 ? 'up' : 'down'} by ${Math.abs(hydrationChange)}% between your first and latest water log.`} />}{averageCalories && <InsightRow icon={Flame} color="text-orange-600" bg="bg-orange-50" text={`Average weekly calorie intake is ${averageCalories.toLocaleString()} kcal.`} />}{weightChange != null && <InsightRow icon={Scale} color="text-emerald-600" bg="bg-emerald-50" text={`Logged weight has changed by ${weightChange > 0 ? '+' : ''}${weightChange} kg.`} />}{!weeklyWorkouts && hydrationChange == null && !averageCalories && weightChange == null && <InsightRow icon={Info} color="text-brand-600" bg="bg-brand-50" text="Add more logs to unlock personalized data insights." />}</div></div>
                <div className="card p-5 sm:p-6"><div className="flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-brand-600" /><div><h2 className="font-bold text-gray-900 dark:text-white">Goal Progress</h2><p className="text-xs text-gray-500">Unavailable targets are not estimated.</p></div></div><div className="space-y-3"><GoalRow label="Workout goal" value={`${weeklyWorkouts} / 3 sessions`} detail={weeklyWorkouts >= 3 ? 'Weekly target complete' : `${3 - weeklyWorkouts} sessions remaining`} percent={Math.min(100, Math.round(weeklyWorkouts / 3 * 100))} color="bg-purple-500" /><GoalRow label="Hydration goal" value={averageWater ? `${averageWater} / ${waterGoal} L` : `0 / ${waterGoal} L`} detail={averageWater ? `${Math.max(0, Math.round((waterGoal - averageWater) * 10) / 10)} L to daily goal` : 'Log water to calculate progress'} percent={averageWater ? Math.min(100, Math.round(averageWater / waterGoal * 100)) : 0} color="bg-sky-500" /><GoalRow label="Nutrition goal" value={averageCalories ? `${averageCalories} kcal` : 'No target'} detail="No calorie target exists in current profile" percent={0} color="bg-orange-500" /><GoalRow label="Weight goal" value={latestWeight ? `${latestWeight} kg` : 'No target'} detail={userProfile?.goal ? `${userProfile.goal}; numeric target not set` : 'Set a profile goal to track this'} percent={0} color="bg-emerald-500" /></div></div>
              </div>
              <div className="card p-5 sm:p-6"><div className="flex items-center gap-2 mb-4"><Trophy className="w-5 h-5 text-orange-500" /><div><h2 className="font-bold text-gray-900 dark:text-white">Personal Records</h2><p className="text-xs text-gray-500">Detected from your recorded activity.</p></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><RecordCard title="Longest workout streak" value={longestWorkoutStreak ? `${longestWorkoutStreak} day${longestWorkoutStreak === 1 ? '' : 's'}` : '—'} icon={Dumbbell} color="text-purple-600" bg="bg-purple-50" /><RecordCard title="Highest calorie log" value={highestCalories ? `${highestCalories.calories} kcal` : '—'} icon={Flame} color="text-orange-600" bg="bg-orange-50" /><RecordCard title="Best hydration day" value={bestHydration ? `${bestHydration.water} L` : '—'} icon={Droplets} color="text-sky-600" bg="bg-sky-50" /><RecordCard title="Monthly workouts" value={monthlyWorkouts ? `${monthlyWorkouts} workouts` : '—'} icon={CalendarDays} color="text-emerald-600" bg="bg-emerald-50" /></div></div>
            </> : <div className="premium-empty-state"><div className="premium-icon bg-brand-50 text-brand-600 shadow-none"><BarChart3 className="w-5 h-5" /></div><h2 className="mt-5 text-xl font-bold text-gray-900">Unlock your analytics</h2><p className="mt-2 max-w-sm text-sm text-gray-500">Log weight, calories, water, or workouts to reveal your trends, goals, and personal records.</p><button onClick={() => setShowAdd(true)} className="btn-primary mt-6"><Plus className="w-4 h-4" /> Add your first log</button></div>}

            {/* ── Today's Recommendations ── */}
            <div className="card p-5 sm:p-6">
              <div className="flex items-center gap-2.5 mb-5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <h2 className="font-bold text-gray-900 dark:text-white">Today's Recommendations</h2>
                <span className="ml-auto badge bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                  Your data
                </span>
              </div>

              {recommendations.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {recommendations.map(({ icon: Icon, color, iconBg, bg, border, title, text, link }, i) => (
                    <div
                      key={i}
                      className={`${bg} border ${border} rounded-2xl p-4 flex items-start gap-3 hover:shadow-card transition-all duration-200`}
                    >
                      <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${color} mb-0.5`}>{title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{text}</p>
                        {link && (
                          <Link
                            to={link}
                            className={`inline-flex items-center gap-1 text-xs font-semibold mt-2 ${color} hover:opacity-75 transition-opacity group`}
                          >
                            Go there
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">All goals on track!</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                      You're hitting your targets — keep up the great work.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* ── Recent Activity (timeline) ── */}
            {progressData.length > 0 && (
              <div className="card p-5 sm:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <h2 className="font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                  </div>
                  <span className="badge bg-surface-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-surface-200 dark:border-gray-700">
                    {progressData.length} {progressData.length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>

                <div className="relative pl-5 max-h-64 sm:max-h-72 overflow-y-auto pr-1">
                  {/* Timeline line */}
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-gray-100 dark:bg-gray-800 rounded-full" />

                  <div className="space-y-4">
                    {[...progressData].reverse().slice(0, 10).map((entry, i) => (
                      <div key={i} className="relative flex items-start gap-3 group">
                        {/* Timeline dot */}
                        <div className="absolute -left-5 top-1.5 w-2.5 h-2.5 rounded-full bg-brand-400 border-2 border-white dark:border-gray-950 flex-shrink-0 group-hover:bg-brand-500 transition-colors" />

                        {/* Date */}
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 min-w-[48px] pt-px shrink-0">
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>

                        {/* Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-px">
                          {entry.workout && (
                            <span className="badge bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-100 dark:border-purple-900">
                              <Dumbbell className="w-2.5 h-2.5 flex-shrink-0" />
                              <span className="truncate max-w-[100px]">{entry.workout}</span>
                            </span>
                          )}
                          {entry.calories && (
                            <span className="badge bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border border-orange-100 dark:border-orange-900">
                              <Flame className="w-2.5 h-2.5 flex-shrink-0" /> {entry.calories} kcal
                            </span>
                          )}
                          {entry.weight && (
                            <span className="badge bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border border-brand-100 dark:border-brand-900">
                              <Scale className="w-2.5 h-2.5 flex-shrink-0" /> {entry.weight} kg
                            </span>
                          )}
                          {entry.water && (
                            <span className="badge bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900">
                              <Droplets className="w-2.5 h-2.5 flex-shrink-0" /> {entry.water} L
                            </span>
                          )}
                          {entry.notes && (
                            <span className="badge bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 italic max-w-[160px] truncate">
                              {entry.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>{/* end LEFT column */}

          {/* ════════ RIGHT / SIDEBAR ════════ */}
          <div className="space-y-4">

            {/* ── Profile card ── */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-gray-900 dark:text-white">Your Profile</h3>
                <Link
                  to="/chat"
                  className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1 transition-colors group"
                >
                  AI Coach
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {userProfile ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <GeneratedAvatar name={userProfile.name} size={48} />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">
                        {userProfile.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {[
                          userProfile.age    && `${userProfile.age} yrs`,
                          userProfile.gender && (userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)),
                        ].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {[
                      { label: 'Height',    value: userProfile.height    ? `${userProfile.height} cm` : '—' },
                      { label: 'Weight',    value: userProfile.weight    ? `${userProfile.weight} kg` : '—' },
                      { label: 'Goal',      value: userProfile.goal      || '—' },
                      { label: 'Level',     value: userProfile.level     || '—' },
                      { label: 'Equipment', value: userProfile.equipment || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{label}</span>
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 text-right max-w-[140px] truncate">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                /* Profile empty state */
                <div className="text-center py-5">
                  <div className="w-14 h-14 bg-surface-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <User className="w-7 h-7 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No profile yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-4 leading-relaxed">
                    Set up your profile to unlock personalised AI coaching and a tailored assessment.
                  </p>
                  <Link to="/chat" className="btn-primary text-xs px-4 py-2 w-full justify-center">
                    <MessageSquare className="w-3.5 h-3.5" /> Start with AI Coach
                  </Link>
                </div>
              )}
            </div>

            {/* ── Quick Actions ── */}
            <div className="card p-5">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-3">Quick Actions</h3>
              <nav className="space-y-0.5" aria-label="Quick navigation">
                {[
                  { to: '/chat',      label: 'AI Coach',         icon: MessageSquare, color: 'text-brand-500',   bg: 'bg-brand-50 dark:bg-brand-950',     hoverBg: 'hover:bg-brand-50 dark:hover:bg-brand-950/50'   },
                  { to: '/workout',   label: 'Workout Planner',  icon: Dumbbell,      color: 'text-purple-500',  bg: 'bg-purple-50 dark:bg-purple-950',   hoverBg: 'hover:bg-purple-50 dark:hover:bg-purple-950/50' },
                  { to: '/nutrition', label: 'Nutrition Guide',  icon: Salad,         color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950', hoverBg: 'hover:bg-emerald-50 dark:hover:bg-emerald-950/50' },
                  { to: '/calories',  label: 'Calorie Calc',     icon: Flame,         color: 'text-orange-500',  bg: 'bg-orange-50 dark:bg-orange-950',   hoverBg: 'hover:bg-orange-50 dark:hover:bg-orange-950/50' },
                  { to: '/bmi',       label: 'BMI Calculator',   icon: Activity,      color: 'text-sky-500',     bg: 'bg-sky-50 dark:bg-sky-950',         hoverBg: 'hover:bg-sky-50 dark:hover:bg-sky-950/50'       },
                  { to: '/exercises', label: 'Exercise Library', icon: BookOpen,      color: 'text-rose-500',    bg: 'bg-rose-50 dark:bg-rose-950',       hoverBg: 'hover:bg-rose-50 dark:hover:bg-rose-950/50'     },
                ].map(({ to, label, icon: Icon, color, bg, hoverBg }) => (
                  <Link
                    key={to}
                    to={to}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${hoverBg} transition-all duration-150 group`}
                  >
                    <div className={`w-7 h-7 ${bg} rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform duration-150`}>
                      <Icon className={`w-3.5 h-3.5 ${color}`} />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300 font-medium flex-1">{label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-gray-500 group-hover:translate-x-0.5 transition-all duration-150" />
                  </Link>
                ))}
              </nav>
            </div>

            {/* ── Daily Motivation ── */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-brand-500" />
                  <h3 className="font-bold text-sm text-gray-900 dark:text-white">Daily Motivation</h3>
                </div>
                <button
                  onClick={fetchMotivation}
                  disabled={loadingMotivation}
                  className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-50"
                  title={motivation ? 'Refresh quote' : 'Get motivation'}
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-gray-400 ${loadingMotivation ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {motivation ? (
                <div className="bg-gradient-to-br from-brand-50 to-surface-100 dark:from-brand-950/40 dark:to-gray-900 border border-brand-100 dark:border-brand-900 rounded-xl p-4 animate-fade-in">
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed italic">"{motivation}"</p>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 font-medium">— FitAI · IBM Granite</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 leading-relaxed">
                    Get your daily AI-powered fitness motivation, generated fresh by IBM Granite.
                  </p>
                  <button
                    onClick={fetchMotivation}
                    disabled={loadingMotivation}
                    className="btn-primary w-full justify-center text-xs py-2 disabled:opacity-60"
                  >
                    {loadingMotivation
                      ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating…</>
                      : <><Zap className="w-3.5 h-3.5" /> Get Motivated</>
                    }
                  </button>
                </div>
              )}
            </div>

            {/* ── IBM Granite badge ── */}
            <div className="rounded-2xl border border-brand-100 dark:border-brand-900 bg-gradient-to-br from-brand-50 to-white dark:from-brand-950/40 dark:to-gray-900/80 p-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <Zap className="w-4 h-4 text-white fill-current" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Powered by IBM Granite</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">AI coaching via IBM Watsonx.ai</p>
              </div>
            </div>

          </div>{/* end RIGHT sidebar */}
        </div>{/* end two-column grid */}
      </div>
    </div>
  )
}
