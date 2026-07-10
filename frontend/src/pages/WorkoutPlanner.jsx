/**
 * Workout Planner — generate personalized workout plans via IBM Granite AI.
 */

import React, { useState } from 'react'
import {
  Dumbbell, RefreshCw, Download, User, Zap, Sparkles,
  Clock3, Flame, Target, ShieldCheck, Activity,
  TimerReset, CalendarDays, HeartPulse, ChevronRight,
  Save, FileText, ArrowRight,
} from 'lucide-react'
import { generateWorkoutPlan } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import UserProfileModal from '../components/UserProfileModal.jsx'
import toast from 'react-hot-toast'

const GOALS = ['Weight Loss', 'Muscle Gain', 'General Fitness', 'Strength', 'Endurance', 'Flexibility']
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']
const LOCATIONS = ['Home', 'Gym', 'Outdoor']
const EQUIPMENT = ['No Equipment', 'Resistance Bands', 'Dumbbells Only', 'Barbell + Dumbbells', 'Full Gym']
const FOCUS = ['Full Body', 'Upper Body', 'Lower Body', 'Core & Abs', 'Push / Pull / Legs', 'Cardio Only']

function parseWorkoutPlan(text) {
  const safeText = (text || '').replace(/\r/g, '')
  const lines = safeText.split('\n').map((line) => line.trim()).filter(Boolean)

  const titleLookup = {
    workout: 'Workout Summary',
    summary: 'Workout Summary',
    duration: 'Estimated Duration',
    calories: 'Estimated Calories Burned',
    difficulty: 'Difficulty',
    muscles: 'Target Muscles',
    target: 'Target Muscles',
    tips: 'Tips',
    warnings: 'Warnings',
  }

  const parsed = {
    summary: '',
    duration: '',
    calories: '',
    difficulty: '',
    muscles: '',
    tips: [],
    warnings: [],
    exercises: [],
  }

  let currentSection = null
  lines.forEach((line) => {
    const sectionMatch = line.match(/^(Workout Summary|Estimated Duration|Estimated Calories Burned|Difficulty|Target Muscles|Tips|Warnings)\s*:??$/i)
    if (sectionMatch) {
      currentSection = titleLookup[sectionMatch[1].toLowerCase().replace(/\s+/g, '')] || sectionMatch[1]
      return
    }

    if (!currentSection) return

    if (currentSection === 'Workout Summary') {
      parsed.summary += `${parsed.summary ? ' ' : ''}${line}`
    } else if (currentSection === 'Estimated Duration') {
      parsed.duration = parsed.duration ? `${parsed.duration} ${line}` : line
    } else if (currentSection === 'Estimated Calories Burned') {
      parsed.calories = parsed.calories ? `${parsed.calories} ${line}` : line
    } else if (currentSection === 'Difficulty') {
      parsed.difficulty = parsed.difficulty ? `${parsed.difficulty} ${line}` : line
    } else if (currentSection === 'Target Muscles') {
      parsed.muscles = parsed.muscles ? `${parsed.muscles} ${line}` : line
    } else if (currentSection === 'Tips') {
      parsed.tips.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''))
    } else if (currentSection === 'Warnings') {
      parsed.warnings.push(line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, ''))
    }
  })

  if (!parsed.summary) {
    const firstParagraph = safeText.split(/\n\n|\n/).find((part) => part.length > 20)
    parsed.summary = firstParagraph || 'A personalized training session designed around your goals and available equipment.'
  }

  if (!parsed.duration) {
    parsed.duration = '35–50 min'
  }
  if (!parsed.calories) {
    parsed.calories = '300–500 kcal'
  }
  if (!parsed.difficulty) {
    parsed.difficulty = 'Moderate'
  }
  if (!parsed.muscles) {
    parsed.muscles = 'Full body'
  }

  const exerciseCandidates = lines.filter((line) => {
    const lower = line.toLowerCase()
    return /(?:^|\s)(squat|deadlift|push-up|pushup|row|press|lunge|plank|run|jog|burpee|bridge|curl|raise|thruster|dip|carry|march|mobility|stretch|hinge|step-up|step up)/i.test(lower)
  })

  if (exerciseCandidates.length > 0) {
    parsed.exercises = exerciseCandidates.slice(0, 5).map((line, index) => {
      const clean = line.replace(/^[-•]\s*/, '').replace(/^\d+\.\s*/, '')
      const name = clean.split(/[:\-–—]/)[0].replace(/^(Exercise\s*\d*[:\-–—]?\s*)/i, '').trim() || `Exercise ${index + 1}`
      const repsMatch = clean.match(/(\d+)\s*(reps?|rep)/i)
      const setsMatch = clean.match(/(\d+)\s*(sets?|set)/i)
      const restMatch = clean.match(/(\d+)\s*(sec|min|mins|minute|minutes)/i)
      const muscleMatch = clean.match(/\b(back|chest|legs|glutes|core|shoulders|arms|full body)\b/i)

      return {
        name,
        sets: setsMatch ? setsMatch[1] : '3',
        reps: repsMatch ? repsMatch[1] : '10–12',
        rest: restMatch ? restMatch[0] : '45–60 sec',
        time: '8–12 min',
        muscle: muscleMatch ? muscleMatch[1] : 'Full body',
      }
    })
  } else {
    parsed.exercises = [
      { name: 'Dynamic warm-up', sets: '1', reps: '8', rest: '30 sec', time: '8 min', muscle: 'Full body' },
      { name: 'Strength circuit', sets: '3', reps: '10–12', rest: '45 sec', time: '20 min', muscle: 'Full body' },
      { name: 'Core finisher', sets: '2', reps: '12–15', rest: '30 sec', time: '10 min', muscle: 'Core' },
      { name: 'Cool down', sets: '1', reps: '6', rest: '30 sec', time: '6 min', muscle: 'Recovery' },
    ]
  }

  return parsed
}

export default function WorkoutPlanner() {
  const { userProfile } = useApp()
  const [form, setForm] = useState({
    goal: 'General Fitness',
    level: 'Beginner',
    location: 'Home',
    equipment: 'No Equipment',
    days_per_week: 3,
    duration_weeks: 4,
    focus: 'Full Body',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
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
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `FitAI_Workout_${form.goal.replace(/\s+/g, '_')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const parsedPlan = parseWorkoutPlan(result?.plan || '')
  const previewDays = ['Mon', 'Wed', 'Fri']
  const tips = parsedPlan.tips.length
    ? parsedPlan.tips.slice(0, 4).map((tip, index) => ({ title: ['Form Tip', 'Recovery Tip', 'Hydration Tip', 'Safety Tip'][index] || 'Coach Tip', text: tip }))
    : [
        { title: 'Form Tip', text: 'Move with control and keep the tempo smooth.' },
        { title: 'Recovery Tip', text: 'Prioritize sleep and active recovery between sessions.' },
        { title: 'Hydration Tip', text: 'Sip water consistently before and after training.' },
        { title: 'Safety Tip', text: 'Stop if you feel sharp pain and scale the load.' },
      ]

  const overviewCards = [
    { label: 'Goal', value: form.goal, icon: Target, accent: 'bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-400' },
    { label: 'Workout Type', value: form.focus, icon: Activity, accent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' },
    { label: 'Duration', value: `${form.duration_weeks} weeks`, icon: Clock3, accent: 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400' },
    { label: 'Difficulty', value: form.level, icon: Sparkles, accent: 'bg-violet-50 text-violet-700 dark:bg-violet-950/30 dark:text-violet-400' },
    { label: 'Equipment', value: form.equipment, icon: Dumbbell, accent: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400' },
    { label: 'Calories', value: parsedPlan.calories, icon: Flame, accent: 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400' },
  ]

  const insightCards = [
    { label: 'Estimated Workout Duration', value: parsedPlan.duration, icon: Clock3 },
    { label: 'Calories Burned', value: parsedPlan.calories, icon: Flame },
    { label: 'Workout Intensity', value: parsedPlan.difficulty, icon: Sparkles },
    { label: 'Recovery Time', value: form.days_per_week >= 5 ? '24–48 hrs' : '48 hrs', icon: HeartPulse },
  ]

  const muscleChips = (parsedPlan.muscles || 'Full body')
    .split(/,|\/| and /i)
    .map((chip) => chip.trim())
    .filter(Boolean)

  const handleSaveWorkout = () => {
    if (!result) return
    const saved = JSON.parse(localStorage.getItem('fitai-saved-workouts') || '[]')
    const entry = {
      id: Date.now(),
      title: `${form.goal} • ${form.focus}`,
      goal: form.goal,
      duration: `${form.duration_weeks} weeks`,
      difficulty: form.level,
      equipment: form.equipment,
      plan: result.plan,
    }
    const updated = [entry, ...saved.filter((item) => item.plan !== result.plan)].slice(0, 8)
    localStorage.setItem('fitai-saved-workouts', JSON.stringify(updated))
    toast.success('Workout saved locally')
  }

  const handleDownloadPdf = () => {
    if (!result) return
    const content = [
      `FitAI Workout Plan`,
      `Goal: ${form.goal}`,
      `Type: ${form.focus}`,
      `Duration: ${form.duration_weeks} weeks`,
      `Difficulty: ${form.level}`,
      `Equipment: ${form.equipment}`,
      '',
      result.plan,
    ].join('\n')

    const pdfLines = content.split('\n').map((line) => `BT /F1 12 Tf 50 780 Td (${line.replace(/\(/g, '\\(').replace(/\)/g, '\\)')}) Tj ET`).join('\n')
    const pdf = `%PDF-1.4\n1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj\n2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj\n3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>endobj\n4 0 obj<< /Length 0 >>stream\n${pdfLines}\nendstream\nendobj\n5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000119 00000 n \n0000000208 00000 n \n0000000303 00000 n \ntrailer<< /Size 6 /Root 1 0 R >>\nstartxref\n0\n%%EOF`
    const blob = new Blob([pdf], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `FitAI_Workout_${form.goal.replace(/\s+/g, '_')}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="premium-page bg-surface-50 px-3 py-4 sm:px-6 sm:py-6 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20">
                <Dumbbell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Workout Planner</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Premium training guidance tailored to your goals</p>
              </div>
            </div>

            <button onClick={() => setShowProfile(true)} className="btn-secondary text-xs px-3 py-2">
              <User className="h-3.5 w-3.5" />
              {userProfile?.name ? `${userProfile.name}'s profile` : 'Set Profile'}
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-brand-500" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Training profile</h2>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Training Goal</label>
                  <select name="goal" value={form.goal} onChange={handleChange} className="select-field">
                    {GOALS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Experience Level</label>
                  <select name="level" value={form.level} onChange={handleChange} className="select-field">
                    {LEVELS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Training Location</label>
                  <select name="location" value={form.location} onChange={handleChange} className="select-field">
                    {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Equipment</label>
                  <select name="equipment" value={form.equipment} onChange={handleChange} className="select-field">
                    {EQUIPMENT.map((e) => <option key={e}>{e}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Focus Area</label>
                  <select name="focus" value={form.focus} onChange={handleChange} className="select-field">
                    {FOCUS.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Workout Duration</label>
                  <input name="duration_weeks" type="range" min={2} max={12} value={form.duration_weeks} onChange={handleChange} className="w-full accent-brand-500" />
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>{form.duration_weeks} weeks</span>
                    <span>12 weeks</span>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                    Weekly Sessions: <span className="font-semibold text-brand-600 dark:text-brand-400">{form.days_per_week}</span>
                  </label>
                  <input name="days_per_week" type="range" min={2} max={6} value={form.days_per_week} onChange={handleChange} className="w-full accent-brand-500" />
                  <div className="mt-1 flex justify-between text-xs text-gray-400">
                    <span>2 days</span>
                    <span>6 days</span>
                  </div>
                </div>
              </div>

              <button onClick={handleGenerate} disabled={loading} className="btn-primary mt-5 flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60">
                {loading ? <><RefreshCw className="h-4 w-4 animate-spin" /> Generating Plan…</> : <><Zap className="h-4 w-4" /> Generate My Workout Plan</>}
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {!result && !loading ? (
              <div className="rounded-[2rem] border border-dashed border-brand-200 bg-brand-50/70 p-8 text-center shadow-sm dark:border-brand-900/60 dark:bg-brand-950/20 sm:p-10">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-gray-900">
                  <Dumbbell className="h-10 w-10 text-brand-600" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">Generate Your Personalized Workout</h3>
                <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                  Your AI trainer will build a workout based on your fitness profile.
                </p>
              </div>
            ) : loading ? (
              <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-8 text-center shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950/30">
                  <RefreshCw className="h-7 w-7 animate-spin" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">Building your coach-led plan</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This usually takes a few seconds.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Personal workout overview</p>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Coach-ready training snapshot</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={handleSaveWorkout} className="btn-secondary text-xs px-3 py-2">
                        <Save className="h-3.5 w-3.5" /> Save Workout
                      </button>
                      <button onClick={handleDownloadPdf} className="btn-secondary text-xs px-3 py-2">
                        <FileText className="h-3.5 w-3.5" /> Download PDF
                      </button>
                      <button onClick={handleGenerate} className="btn-secondary text-xs px-3 py-2">
                        <RefreshCw className="h-3.5 w-3.5" /> Generate Again
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {overviewCards.map((card) => (
                      <div key={card.label} className="rounded-2xl border border-gray-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900">
                        <div className={`inline-flex rounded-full p-2 ${card.accent}`}>
                          <card.icon className="h-4 w-4" />
                        </div>
                        <p className="mt-3 text-[10px] uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{card.label}</p>
                        <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{card.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-brand-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Weekly workout preview</h3>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {previewDays.map((day, index) => (
                      <div key={day} className="rounded-2xl border border-gray-200 bg-slate-50 p-3 text-sm dark:border-gray-700 dark:bg-gray-900">
                        <p className="font-semibold text-gray-900 dark:text-white">{day}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {index === 0 ? 'Strength' : index === 1 ? 'Cardio + core' : 'Mobility + recovery'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="h-4 w-4 text-brand-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Workout summary</h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">{parsedPlan.summary}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {insightCards.map((card) => (
                    <div key={card.label} className="rounded-[1.5rem] border border-gray-200 bg-white/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-900/80">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                        <card.icon className="h-4 w-4 text-brand-500" />
                        {card.label}
                      </div>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{card.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-brand-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Target muscles</h3>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {muscleChips.map((chip, index) => (
                      <span key={chip} className={`rounded-full px-3 py-1.5 text-sm font-semibold ${index === 0 ? 'bg-brand-600 text-white' : 'bg-slate-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                        {chip}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                  <div className="flex items-center gap-2">
                    <TimerReset className="h-4 w-4 text-brand-500" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Workout timeline</h3>
                  </div>
                  <div className="relative mt-5 ml-2 border-l border-gray-200 pl-6 dark:border-gray-700">
                    {parsedPlan.exercises.map((exercise, index) => (
                      <div key={`${exercise.name}-${index}`} className="relative pb-5">
                        <div className="absolute -left-[1.4rem] top-2 h-3.5 w-3.5 rounded-full border-4 border-white bg-brand-500 dark:border-gray-900" />
                        <div className="rounded-2xl border border-gray-200 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{exercise.name}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-700 dark:bg-brand-950/30 dark:text-brand-400">{exercise.sets} sets</span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600 dark:bg-gray-800 dark:text-gray-300">{exercise.reps} reps</span>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-gray-600 dark:bg-gray-800 dark:text-gray-300">{exercise.rest}</span>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              <p>Target: {exercise.muscle}</p>
                              <p className="mt-1">Time: {exercise.time}</p>
                              {form.equipment !== 'No Equipment' && <p className="mt-1">Equipment: {form.equipment}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-brand-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Coach tips</h3>
                    </div>
                    <div className="mt-4 space-y-3">
                      {tips.slice(0, 5).map((tip) => (
                        <div key={tip.title} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-slate-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                          <div className="mt-0.5 rounded-full bg-brand-50 p-1.5 text-brand-600 dark:bg-brand-950/30">
                            <ShieldCheck className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{tip.title}</p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{tip.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-brand-500" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Warnings</h3>
                    </div>
                    {parsedPlan.warnings.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {parsedPlan.warnings.map((warning) => (
                          <div key={warning} className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
                            {warning}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
                        No major cautions for this plan.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  )
}
