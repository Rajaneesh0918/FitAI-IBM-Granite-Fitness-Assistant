/**
 * BMI Health Assessment — presentation layer for the existing BMI endpoint.
 */

import React, { useState } from 'react'
import {
  Activity, ArrowRight, HeartPulse, Info, RefreshCw, Scale,
  Sparkles, Target, TrendingUp, Weight,
} from 'lucide-react'
import { calculateBMI } from '../services/api.js'
import toast from 'react-hot-toast'

const BMI_CATEGORIES = [
  { label: 'Underweight', range: '< 18.5', color: '#3b82f6', track: 'bg-blue-500' },
  { label: 'Healthy', range: '18.5 – 24.9', color: '#16a34a', track: 'bg-emerald-500' },
  { label: 'Overweight', range: '25 – 29.9', color: '#f97316', track: 'bg-orange-500' },
  { label: 'Obesity Class I', range: '30–34.9', color: '#ef4444', track: 'bg-red-500' },
  { label: 'Obesity Class II', range: '35–39.9', color: '#ef4444', track: 'bg-red-500' },
  { label: 'Obesity Class III', range: '40+', color: '#ef4444', track: 'bg-red-500' },
]

function getAssessment(bmi) {
  const value = Number(bmi)
  if (value < 18.5) return {
    label: 'Underweight', color: '#3b82f6', badge: 'bg-blue-50 text-blue-700 border-blue-100', risk: 'Moderate',
    health: 'Below the healthy BMI range', recommendation: 'Focus on gradual, nutrient-dense weight gain.',
    activity: 'Build strength 2–3 times per week.', goal: 'Move toward the healthy range.',
  }
  if (value < 25) return {
    label: 'Healthy', color: '#16a34a', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', risk: 'Low',
    health: 'Within the healthy BMI range', recommendation: 'Maintain your balanced routine and nutrition.',
    activity: 'Keep a mix of cardio and strength work.', goal: 'Maintain your current healthy range.',
  }
  if (value < 30) return {
    label: 'Overweight', color: '#f97316', badge: 'bg-orange-50 text-orange-700 border-orange-100', risk: 'Elevated',
    health: 'Above the healthy BMI range', recommendation: 'Aim for small, sustainable nutrition changes.',
    activity: 'Add regular walks and full-body strength sessions.', goal: 'Work gradually toward the healthy range.',
  }
  return {
    label: 'Obese', color: '#ef4444', badge: 'bg-red-50 text-red-700 border-red-100', risk: 'High',
    health: 'Well above the healthy BMI range', recommendation: 'Start with manageable habits and professional guidance.',
    activity: 'Begin with low-impact movement most days.', goal: 'Set a safe, gradual weight-management goal.',
  }
}

function getWHOAssessment(bmi) {
  const value = Number(bmi)
  if (value < 18.5) return { label: 'Underweight', color: '#3b82f6', badge: 'bg-blue-50 text-blue-700 border-blue-100', risk: 'Possible nutritional deficiency', health: 'Below the healthy BMI range', recommendation: 'Increase nutrient-dense calorie intake gradually.', activity: 'Prioritise strength training 2–3 times weekly.', goal: 'Move toward the healthy BMI range.' }
  if (value < 25) return { label: 'Healthy', color: '#16a34a', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100', risk: 'Low', health: 'Within the healthy BMI range', recommendation: 'Maintain your balanced routine and nutrition.', activity: 'Keep a mix of cardio and strength work.', goal: 'Maintain your current healthy range.' }
  if (value < 30) return { label: 'Overweight', color: '#f97316', badge: 'bg-orange-50 text-orange-700 border-orange-100', risk: 'Moderate', health: 'Above the healthy BMI range', recommendation: 'Aim for a moderate calorie deficit with regular exercise.', activity: 'Add regular walks and full-body strength sessions.', goal: 'Work gradually toward the healthy range.' }
  if (value < 35) return { label: 'Obesity Class I', color: '#ef4444', badge: 'bg-red-50 text-red-700 border-red-100', risk: 'High', health: 'Above the healthy BMI range', recommendation: 'Use a gradual calorie deficit with consistent activity.', activity: 'Build a low-impact exercise routine most days.', goal: 'Work toward a clinically appropriate weight goal.' }
  if (value < 40) return { label: 'Obesity Class II', color: '#ef4444', badge: 'bg-red-50 text-red-700 border-red-100', risk: 'High', health: 'Well above the healthy BMI range', recommendation: 'Seek professional support for a personalised plan.', activity: 'Start low-impact movement under appropriate guidance.', goal: 'Set a safe, gradual weight-management goal.' }
  return { label: 'Obesity Class III', color: '#ef4444', badge: 'bg-red-50 text-red-700 border-red-100', risk: 'Very high', health: 'Substantially above the healthy BMI range', recommendation: 'Consult a healthcare professional for supported weight management.', activity: 'Discuss a safe, low-impact activity plan with a clinician.', goal: 'Focus on safe, professionally supported progress.' }
}

function normaliseMeasurements(weightInput, heightInput) {
  const weight = Number.parseFloat(weightInput)
  const enteredHeight = Number.parseFloat(heightInput)
  if (!Number.isFinite(weight) || !Number.isFinite(enteredHeight)) return { error: 'Enter both your height and weight to continue.' }
  const heightCm = enteredHeight > 0 && enteredHeight < 3 ? enteredHeight * 100 : enteredHeight
  if (heightCm < 100 || heightCm > 250) return { error: 'Enter a height between 100 and 250 cm, or metres such as 1.75.' }
  if (weight < 20 || weight > 500) return { error: 'Enter a weight between 20 and 500 kg.' }
  return { weight, heightCm }
}

function calculateWHOResult(weight, heightCm) {
  const heightM = heightCm / 100
  return {
    bmi: Number((weight / (heightM ** 2)).toFixed(1)),
    ideal_weight_min: (18.5 * (heightM ** 2)).toFixed(1),
    ideal_weight_max: (24.9 * (heightM ** 2)).toFixed(1),
  }
}

function BMICircle({ bmi, color }) {
  const radius = 72
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(Math.max((Number(bmi) - 15) / 30, 0), 1)
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="relative h-52 w-52 shrink-0" aria-label={`BMI ${bmi}`}>
      <svg className="h-full w-full -rotate-90" viewBox="0 0 176 176">
        <circle cx="88" cy="88" r={radius} fill="none" stroke="#eef2f7" strokeWidth="12" />
        <circle
          cx="88" cy="88" r={radius} fill="none" stroke={color} strokeWidth="12"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={dashOffset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Your BMI</span>
        <span className="mt-1 text-5xl font-bold tracking-tight text-gray-900 tabular-nums">{bmi}</span>
        <span className="mt-1 text-xs text-gray-400">BMI score</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, color = 'text-brand-600', className = '' }) {
  return (
    <div className={`premium-stat-card ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="mt-2 text-lg font-bold text-gray-900">{value}</p>
    </div>
  )
}

export default function BMICalculator() {
  const [form, setForm] = useState({ weight: '', height: '', age: '', gender: 'Female' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  const handleCalc = async () => {
    const measurements = normaliseMeasurements(form.weight, form.height)
    if (measurements.error) return toast.error(measurements.error)
    setLoading(true)
    try {
      await calculateBMI(measurements.weight, measurements.heightCm)
      setResult(calculateWHOResult(measurements.weight, measurements.heightCm))
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const assessment = result ? getWHOAssessment(result.bmi) : null

  return (
    <div className="min-h-[calc(100vh-4rem)] mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-500 shadow-card-md">
            <HeartPulse className="h-5 w-5 text-white" />
          </div>
          <h1 className="section-title">BMI Health Assessment</h1>
          <p className="section-subtitle">A clear view of your body-mass health markers.</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:self-auto">
          <Activity className="h-3.5 w-3.5" /> Health snapshot
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.45fr)]">
        <section className="premium-card h-fit">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Scale className="h-5 w-5" /></div>
            <div><h2 className="font-bold text-gray-900">Your measurements</h2><p className="text-xs text-gray-500">Used to calculate your BMI</p></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="col-span-1"><span className="mb-1.5 block text-xs font-semibold text-gray-600">Height <span className="font-normal text-gray-400">(cm)</span></span><input name="height" value={form.height} onChange={handleChange} type="number" placeholder="175" min="100" max="250" className="input-field" /></label>
            <label className="col-span-1"><span className="mb-1.5 block text-xs font-semibold text-gray-600">Weight <span className="font-normal text-gray-400">(kg)</span></span><input name="weight" value={form.weight} onChange={handleChange} type="number" placeholder="70" min="20" max="300" className="input-field" /></label>
            <label className="col-span-1"><span className="mb-1.5 block text-xs font-semibold text-gray-600">Age <span className="font-normal text-gray-400">(optional)</span></span><input name="age" value={form.age} onChange={handleChange} type="number" placeholder="28" min="1" max="120" className="input-field" /></label>
            <label className="col-span-1"><span className="mb-1.5 block text-xs font-semibold text-gray-600">Gender</span><select name="gender" value={form.gender} onChange={handleChange} className="input-field"><option>Female</option><option>Male</option><option>Prefer not to say</option></select></label>
          </div>
          <button onClick={handleCalc} disabled={loading} className="btn-primary mt-6 w-full justify-center py-3 disabled:opacity-60">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />} Calculate BMI
          </button>
          <p className="mt-4 text-center text-xs text-gray-400">Your assessment is calculated instantly and privately.</p>
        </section>

        <section className="min-w-0">
          {!result ? (
            <div className="flex min-h-[470px] flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gradient-to-br from-white to-brand-50/40 p-8 text-center shadow-card">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600"><Sparkles className="h-7 w-7" /></div>
              <h2 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Know Your Body Better</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">Calculate your BMI and receive personalized health insights.</p>
              <div className="mt-8 grid w-full max-w-md grid-cols-3 gap-3 text-left"><StatCard label="BMI status" value="Ready" icon={HeartPulse} /><StatCard label="Health range" value="—" icon={Target} /><StatCard label="Risk level" value="—" icon={TrendingUp} /></div>
            </div>
          ) : (
            <div className="animate-slide-up space-y-5">
              <div className="premium-card">
                <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
                  <BMICircle bmi={result.bmi} color={assessment.color} />
                  <div className="w-full text-center sm:text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400">Health category</p>
                    <h2 className="mt-1 text-2xl font-bold text-gray-900">{assessment.label}</h2>
                    <span className={`mt-3 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${assessment.badge}`}>{assessment.health}</span>
                    <p className="mt-4 text-sm leading-6 text-gray-500">BMI is a screening measure. Your wider health picture includes fitness, nutrition, and medical history.</p>
                  </div>
                </div>
                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatCard label="BMI value" value={result.bmi} icon={Activity} color="text-brand-600" />
                  <StatCard label="Health status" value={assessment.label} icon={HeartPulse} color="text-emerald-600" />
                  <StatCard label="Healthy weight range" value={`${result.ideal_weight_min}–${result.ideal_weight_max} kg`} icon={Weight} color="text-emerald-600" />
                  <StatCard label="Risk level" value={assessment.risk} icon={TrendingUp} color="text-orange-500" />
                </div>
              </div>

              <div className="premium-card shadow-card">
                <div className="mb-5 flex items-center justify-between"><div><h3 className="font-bold text-gray-900">BMI scale</h3><p className="mt-0.5 text-xs text-gray-500">Your current category is highlighted below.</p></div><span className="text-xs font-semibold text-gray-400">16—40 BMI</span></div>
                <div className="flex h-3 overflow-hidden rounded-full bg-gray-100">
                  {BMI_CATEGORIES.map((category) => <div key={category.label} className={`${category.track} h-full`} style={{ width: '25%' }} />)}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-1">
                  {BMI_CATEGORIES.map((category) => {
                    const active = category.label === assessment.label
                    return <div key={category.label} className={`rounded-xl p-2 transition-all ${active ? 'bg-gray-50 ring-1 ring-gray-200 shadow-sm' : ''}`}><p className={`text-xs font-bold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{category.label}</p><p className="mt-0.5 text-[11px] text-gray-400">{category.range}</p>{active && <span className="mt-1 block text-[10px] font-bold text-brand-600">YOU</span>}</div>
                  })}
                </div>
              </div>

              <div><div className="mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-brand-600" /><h3 className="font-bold text-gray-900">AI Health Insights</h3></div><div className="grid gap-3 sm:grid-cols-2"><InsightCard title="Current health" text={assessment.health} icon={HeartPulse} color="text-emerald-600" /><InsightCard title="Recommendation" text={assessment.recommendation} icon={ArrowRight} color="text-brand-600" /><InsightCard title="Activity suggestion" text={assessment.activity} icon={Activity} color="text-orange-500" /><InsightCard title="Weight goal" text={assessment.goal} icon={Target} color="text-brand-600" /></div></div>

              <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-xs leading-5 text-blue-800"><Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />BMI is a general screening tool and does not account for muscle mass, bone density, or body-fat distribution. Consult a healthcare professional for a complete assessment.</div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function InsightCard({ title, text, icon: Icon, color }) {
  return <div className="premium-stat-card"><div className="flex items-start gap-3"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-50 ${color}`}><Icon className="h-4 w-4" /></div><div><p className="text-xs font-bold text-gray-900">{title}</p><p className="mt-1 text-xs leading-5 text-gray-500">{text}</p></div></div></div>
}
