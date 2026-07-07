/**
 * BMI Calculator — calculates BMI with visual gauge and category display.
 */

import React, { useState } from 'react'
import { Activity, RefreshCw, Info } from 'lucide-react'
import { calculateBMI } from '../services/api.js'
import toast from 'react-hot-toast'

const CATEGORIES = [
  { label: 'Underweight', range: '< 18.5',      color: 'bg-blue-500',   text: 'text-blue-600 dark:text-blue-400' },
  { label: 'Normal',      range: '18.5 – 24.9',  color: 'bg-brand-500',  text: 'text-brand-600 dark:text-brand-400' },
  { label: 'Overweight',  range: '25 – 29.9',    color: 'bg-yellow-500', text: 'text-yellow-600 dark:text-yellow-400' },
  { label: 'Obese',       range: '≥ 30',          color: 'bg-red-500',    text: 'text-red-600 dark:text-red-400' },
]

function BMIGauge({ bmi }) {
  // Map BMI to 0–100% position on gauge (16 = 0%, 40 = 100%)
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max)
  const pct   = clamp(((bmi - 16) / 24) * 100, 0, 100)

  return (
    <div className="relative w-full h-6 rounded-full overflow-hidden flex">
      <div className="flex-1 bg-blue-400"   title="Underweight" />
      <div className="flex-1 bg-brand-400"  title="Normal" />
      <div className="flex-1 bg-yellow-400" title="Overweight" />
      <div className="flex-1 bg-red-400"    title="Obese" />
      {/* Pointer */}
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-gray-700 dark:border-gray-300 rounded-full shadow-md transition-all duration-700"
        style={{ left: `calc(${pct}% - 8px)` }}
      />
    </div>
  )
}

export default function BMICalculator() {
  const [form, setForm]     = useState({ weight: '', height: '', unit: 'metric' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleCalc = async () => {
    const weight = parseFloat(form.weight)
    const height = parseFloat(form.height)
    if (!weight || !height || weight <= 0 || height <= 0) {
      return toast.error('Please enter valid weight and height values.')
    }
    setLoading(true)
    try {
      const { data } = await calculateBMI(weight, height)
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
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="section-title">BMI Calculator</h1>
        </div>
        <p className="section-subtitle">
          Calculate your Body Mass Index and find your ideal weight range instantly.
        </p>
      </div>

      {/* BMI categories reference */}
      <div className="card p-4 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(({ label, range, color, text }) => (
            <div key={label} className="text-center">
              <div className={`w-full h-2 ${color} rounded-full mb-1.5`} />
              <p className={`text-xs font-semibold ${text}`}>{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{range}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Input card */}
      <div className="card p-6 mb-6">
        <h2 className="font-bold text-gray-900 dark:text-white mb-5">Enter Your Measurements</h2>
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Weight (kg)</label>
            <input
              name="weight" value={form.weight} onChange={handleChange}
              type="number" placeholder="70" min="20" max="300"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Height (cm)</label>
            <input
              name="height" value={form.height} onChange={handleChange}
              type="number" placeholder="175" min="100" max="250"
              className="input-field"
            />
          </div>
        </div>

        <button onClick={handleCalc} disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
          Calculate BMI
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="card p-6 animate-slide-up">
          <h2 className="font-bold text-gray-900 dark:text-white mb-5">Your Results</h2>

          {/* BMI number */}
          <div className="text-center mb-6">
            <div
              className="text-6xl font-bold mb-1"
              style={{ color: result.color }}
            >
              {result.bmi}
            </div>
            <div
              className="inline-flex px-4 py-1.5 rounded-full text-sm font-semibold text-white mt-1"
              style={{ backgroundColor: result.color }}
            >
              {result.category}
            </div>
          </div>

          {/* Gauge */}
          <div className="mb-6">
            <BMIGauge bmi={result.bmi} />
            <div className="flex justify-between text-xs text-gray-400 mt-1.5">
              <span>16</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Your BMI</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.bmi}</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ideal Weight Range</p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {result.ideal_weight_min}–{result.ideal_weight_max} kg
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
            BMI is a general screening tool and does not account for muscle mass, bone density, or distribution of fat. Consult a healthcare professional for a complete assessment.
          </div>
        </div>
      )}
    </div>
  )
}
