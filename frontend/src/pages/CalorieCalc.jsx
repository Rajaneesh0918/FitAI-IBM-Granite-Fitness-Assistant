/**
 * Calorie Calculator — TDEE, BMR, and macro breakdown with goal-based targets.
 */

import React, { useState } from 'react'
import { Calculator, RefreshCw, Droplets, Flame, Apple } from 'lucide-react'
import { calculateCalories } from '../services/api.js'
import toast from 'react-hot-toast'

const ACTIVITY_LEVELS = [
  { value: 'sedentary',   label: 'Sedentary',     desc: 'Little or no exercise, desk job' },
  { value: 'light',       label: 'Lightly Active', desc: 'Light exercise 1–3 days/week' },
  { value: 'moderate',    label: 'Moderately Active', desc: 'Moderate exercise 3–5 days/week' },
  { value: 'active',      label: 'Very Active',   desc: 'Hard exercise 6–7 days/week' },
  { value: 'very_active', label: 'Extremely Active', desc: 'Very hard exercise + physical job' },
]

function MacroBar({ protein, carbs, fat }) {
  const total  = protein + carbs + fat
  const pPct   = Math.round((protein / total) * 100)
  const cPct   = Math.round((carbs   / total) * 100)
  const fPct   = 100 - pPct - cPct

  return (
    <div>
      <div className="flex h-4 rounded-full overflow-hidden">
        <div className="bg-brand-500"   style={{ width: `${pPct}%` }} title={`Protein ${pPct}%`} />
        <div className="bg-yellow-400"  style={{ width: `${cPct}%` }} title={`Carbs ${cPct}%`} />
        <div className="bg-orange-400"  style={{ width: `${fPct}%` }} title={`Fat ${fPct}%`} />
      </div>
      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500 inline-block" />{pPct}% Protein</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />{cPct}% Carbs</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />{fPct}% Fat</span>
      </div>
    </div>
  )
}

export default function CalorieCalc() {
  const [form, setForm]     = useState({ weight: '', height: '', age: '', gender: 'male', activity: 'moderate' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleCalc = async () => {
    if (!form.weight || !form.height || !form.age) {
      return toast.error('Please fill in weight, height, and age.')
    }
    setLoading(true)
    try {
      const { data } = await calculateCalories(form)
      setResult(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6 text-white" />
          </div>
          <h1 className="section-title">Calorie Calculator</h1>
        </div>
        <p className="section-subtitle">
          Calculate your daily calorie needs (TDEE), BMR, and precise macro targets.
        </p>
      </div>

      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-5">Your Measurements</h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Weight (kg)</label>
            <input name="weight" value={form.weight} onChange={handleChange} type="number" placeholder="70" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Height (cm)</label>
            <input name="height" value={form.height} onChange={handleChange} type="number" placeholder="175" className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Age</label>
            <input name="age" value={form.age} onChange={handleChange} type="number" placeholder="25" className="input-field" min="10" max="100" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="select-field">
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Activity Level</label>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map(({ value, label, desc }) => (
              <label
                key={value}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                  ${form.activity === value
                    ? 'border-brand-400 bg-brand-50 dark:bg-brand-950'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
              >
                <input type="radio" name="activity" value={value} checked={form.activity === value} onChange={handleChange} className="accent-brand-500" />
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button onClick={handleCalc} disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
          {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Calculating…</> : <><Calculator className="w-4 h-4" /> Calculate My Calories</>}
        </button>
      </div>

      {result && (
        <div className="card p-6 space-y-5 animate-slide-up">
          <h2 className="font-bold text-gray-900 dark:text-white">Your Daily Calorie Needs</h2>

          {/* TDEE and BMR */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 rounded-xl p-4 text-center">
              <Flame className="w-6 h-6 text-brand-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">TDEE (Maintain Weight)</p>
              <p className="text-3xl font-bold text-brand-600 dark:text-brand-400 mt-1">{result.tdee}</p>
              <p className="text-xs text-gray-400 mt-0.5">kcal/day</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <Apple className="w-6 h-6 text-gray-500 mx-auto mb-2" />
              <p className="text-xs text-gray-500 dark:text-gray-400">BMR (Resting)</p>
              <p className="text-3xl font-bold text-gray-700 dark:text-gray-300 mt-1">{result.bmr}</p>
              <p className="text-xs text-gray-400 mt-0.5">kcal/day</p>
            </div>
          </div>

          {/* Goal-based targets */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Goal-Based Calorie Targets</h3>
            <div className="space-y-2">
              {[
                { label: 'Weight Loss (–500 kcal)', value: result.weight_loss_calories, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Maintenance',             value: result.tdee,                  color: 'text-brand-600 dark:text-brand-400' },
                { label: 'Lean Muscle Gain (+200)', value: result.muscle_gain_calories,  color: 'text-purple-600 dark:text-purple-400' },
                { label: 'Weight Gain (+300)',       value: result.weight_gain_calories,  color: 'text-orange-600 dark:text-orange-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
                  <span className={`text-sm font-bold ${color}`}>{value} kcal</span>
                </div>
              ))}
            </div>
          </div>

          {/* Macros */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Daily Macro Breakdown (Maintenance)</h3>
            <MacroBar protein={result.protein_g * 4} carbs={result.carbs_g * 4} fat={result.fat_g * 9} />
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Protein', value: result.protein_g, unit: 'g', color: 'text-brand-600 dark:text-brand-400' },
                { label: 'Carbs',   value: result.carbs_g,   unit: 'g', color: 'text-yellow-600 dark:text-yellow-400' },
                { label: 'Fat',     value: result.fat_g,     unit: 'g', color: 'text-orange-600 dark:text-orange-400' },
              ].map(({ label, value, unit, color }) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                  <p className={`text-xl font-bold ${color}`}>{value}<span className="text-xs ml-0.5">{unit}</span></p>
                </div>
              ))}
            </div>
          </div>

          {/* Water + Fiber */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
              <Droplets className="w-6 h-6 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Daily Water</p>
                <p className="font-bold text-blue-600 dark:text-blue-400">{result.water_l} L</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-3">
              <Apple className="w-6 h-6 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Daily Fiber</p>
                <p className="font-bold text-green-600 dark:text-green-400">{result.fiber_g}g</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
