/**
 * Nutrition Page — AI-powered meal plans and nutrition guidance.
 */

import React, { useState } from 'react'
import {
  Salad, RefreshCw, Download, Zap, Sparkles,
  Activity, Droplet, Sun, Cloud, Coffee, Moon,
  ShoppingCart, Leaf,
} from 'lucide-react'
import { getNutritionGuidance } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import AIResponseCard from '../components/AIResponseCard.jsx'
import toast from 'react-hot-toast'

const GOALS      = ['Weight Loss', 'Muscle Gain', 'Weight Gain', 'Maintenance', 'Heart Health', 'Diabetes Management']
const DIET_TYPES = ['Balanced', 'Vegetarian', 'Vegan', 'Keto / Low-Carb', 'High-Protein', 'Mediterranean', 'Paleo']
const ACTIVITY_LEVELS = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']
const FOOD_TYPES = ['Vegetarian', 'Non-Vegetarian']
const DURATIONS  = ['1-day', '3-day', '7-day', '14-day']

export default function Nutrition() {
  const { userProfile } = useApp()
  const [form, setForm] = useState({
    goal: 'Weight Loss',
    age: userProfile?.age || 28,
    gender: userProfile?.gender || 'Female',
    height: userProfile?.height || 165,
    weight: userProfile?.weight || 65,
    activity: userProfile?.activity || 'Moderate',
    diet_type: 'Balanced',
    food_type: 'Vegetarian',
    meals_per_day: 3,
    allergies: '',
    budget_period: 'daily',
    budget_amount: 250,
    duration: '7-day',
    calories: 2000,
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
      const { data } = await getNutritionGuidance({ ...form, user_profile: {
        ...userProfile,
        age: form.age,
        gender: form.gender,
        height: form.height,
        weight: form.weight,
        activity: form.activity,
      }})
      setResult(data)
      toast.success('Nutrition plan generated! 🥗')
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

  const dailyBudget = form.budget_period === 'weekly'
    ? Math.max(0, Math.round(form.budget_amount / 7))
    : form.budget_period === 'monthly'
    ? Math.max(0, Math.round(form.budget_amount / 30))
    : Math.max(0, form.budget_amount)

  const mealCosts = {
    breakfast: Math.round(dailyBudget * 0.24),
    snack1:    Math.round(dailyBudget * 0.1),
    lunch:     Math.round(dailyBudget * 0.32),
    snack2:    Math.round(dailyBudget * 0.08),
    dinner:    Math.round(dailyBudget * 0.26),
  }

  const calories = Number(form.calories)
  const proteinGrams = Math.round((calories * 0.3) / 4)
  const carbsGrams   = Math.round((calories * 0.45) / 4)
  const fatGrams     = Math.round((calories * 0.25) / 9)
  const fiberGrams   = 30
  const waterLiters  = 2.5

  const groceryList = [
    'Rice – 1 kg',
    'Dal / Lentils – 500 g',
    form.food_type === 'Vegetarian' ? 'Paneer / Tofu – 250 g' : 'Chicken / Eggs – 500 g',
    'Milk – 2 L',
    'Seasonal vegetables – 2 kg',
    'Fruits – 1 kg',
    'Oats – 500 g',
    'Peanuts – 200 g',
  ]

  const budgetSuggestions = dailyBudget < 100
    ? [
        'Use seasonal vegetables and pulses to keep costs low.',
        'Choose local grains like rice and millets instead of imported products.',
        'Swap nuts for peanuts and lentils for more affordable protein.',
      ]
    : dailyBudget < 300
    ? [
        'Aim for balanced meals with rice, eggs, pulses and greens.',
        'Add a mix of vegetables, fruits and affordable protein every day.',
        'Use dairy, paneer or chicken as cost-effective protein options.',
      ]
    : [
        'Enjoy a more varied plate with lean protein and fresh produce.',
        'Add premium seasonal fruits and higher-protein snacks where possible.',
        'Maintain balance by pairing richer meals with whole grains.',
      ]

  const nutritionTips = [
    {
      title: 'Smart ingredient choices',
      text: 'Choose local vegetables and pulses to keep meals cost-effective.',
      icon: Leaf,
    },
    {
      title: 'Stay hydrated',
      text: 'Aim for at least 2.5 L of water daily to support digestion and energy.',
      icon: Droplet,
    },
    {
      title: 'Protein on a budget',
      text: form.food_type === 'Vegetarian'
        ? 'Use paneer, tofu, lentils, and chickpeas for affordable protein.'
        : 'Eggs, milk, and chicken are excellent budget-friendly protein choices.',
      icon: Activity,
    },
  ]

  const mealTimeline = [
    {
      name: 'Breakfast',
      time: '7:30 AM',
      foods: form.diet_type === 'Vegan'
        ? ['Oats', 'Banana', 'Almond butter']
        : ['Greek yogurt', 'Oats', 'Seasonal fruit'],
      calories: Math.round(calories * 0.24),
      cost: mealCosts.breakfast,
      icon: Sun,
    },
    {
      name: 'Morning Snack',
      time: '10:30 AM',
      foods: form.food_type === 'Vegetarian'
        ? ['Apple', 'Mixed nuts']
        : ['Boiled eggs', 'Fruit'],
      calories: Math.round(calories * 0.08),
      cost: mealCosts.snack1,
      icon: Coffee,
    },
    {
      name: 'Lunch',
      time: '1:30 PM',
      foods: form.food_type === 'Vegetarian'
        ? ['Paneer rice bowl', 'Salad', 'Curd']
        : ['Chicken rice bowl', 'Vegetables', 'Yogurt'],
      calories: Math.round(calories * 0.3),
      cost: mealCosts.lunch,
      icon: Activity,
    },
    {
      name: 'Evening Snack',
      time: '4:30 PM',
      foods: ['Trail mix', 'Tea', 'Fruit'],
      calories: Math.round(calories * 0.06),
      cost: mealCosts.snack2,
      icon: Cloud,
    },
    {
      name: 'Dinner',
      time: '8:00 PM',
      foods: form.food_type === 'Vegetarian'
        ? ['Dal', 'Rice', 'Seasonal vegetables']
        : ['Grilled protein', 'Rice', 'Vegetables'],
      calories: Math.round(calories * 0.32),
      cost: mealCosts.dinner,
      icon: Moon,
    },
  ]

  const groceryGroups = [
    { title: 'Grains', items: ['Brown rice', 'Oats', 'Millets'], icon: Leaf },
    { title: 'Protein', items: ['Eggs', 'Paneer', 'Tofu'], icon: Activity },
    { title: 'Fruits', items: ['Bananas', 'Apples', 'Oranges'], icon: Sparkles },
    { title: 'Vegetables', items: ['Spinach', 'Carrots', 'Tomatoes'], icon: Salad },
    { title: 'Dairy', items: ['Milk', 'Curd', 'Yogurt'], icon: ShoppingCart },
    { title: 'Others', items: ['Peanuts', 'Olive oil', 'Herbs'], icon: Zap },
  ]

  const weeklyCost = Math.round(dailyBudget * 7)
  const budgetRemaining = Math.max(0, form.budget_amount - weeklyCost)
  const budgetStats = [
    { label: 'Daily Cost', value: `₹${dailyBudget}`, detail: 'Estimated daily spend' },
    { label: 'Weekly Cost', value: `₹${weeklyCost}`, detail: 'Projected 7-day spend' },
    { label: budgetRemaining > 0 ? 'Budget Remaining' : 'Budget Fully Utilized', value: `₹${budgetRemaining}`, detail: 'Within your selected budget' },
  ]

  const optimizationCards = budgetSuggestions.map((suggestion, index) => ({
    id: index,
    text: suggestion,
    icon: Sparkles,
  }))

  const affordableAlternatives = dailyBudget < 300
    ? [
        { replace: 'Chicken breast', with: 'Eggs or tofu', savings: '₹50/day' },
        { replace: 'Fresh berries', with: 'Bananas or apples', savings: '₹30/day' },
      ]
    : []

  return (
    <div className="premium-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-brand-50/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-brand-600">
              Nutrition Planner
            </div>
            <div className="space-y-2">
              <h1 className="section-title">Budget-first nutrition dashboard</h1>
              <p className="section-subtitle max-w-3xl">Compact, goal-driven meal planning with cost visibility.</p>
            </div>
          </div>
          <div className="rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-brand-600">
              <Sparkles className="h-4 w-4" />
              <span>Smart budget focus</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="card p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Personal information</p>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your profile</h2>
                </div>
                <Activity className="h-5 w-5 text-brand-500" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Goal</label>
                  <select name="goal" value={form.goal} onChange={handleChange} className="select-field">
                    {GOALS.map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Age</label>
                  <input name="age" value={form.age} onChange={handleChange} type="number" min={14} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</label>
                  <select name="gender" value={form.gender} onChange={handleChange} className="select-field">
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Activity Level</label>
                  <select name="activity" value={form.activity} onChange={handleChange} className="select-field">
                    {ACTIVITY_LEVELS.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Height (cm)</label>
                  <input name="height" value={form.height} onChange={handleChange} type="number" min={100} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Weight (kg)</label>
                  <input name="weight" value={form.weight} onChange={handleChange} type="number" min={30} className="input-field" />
                </div>
              </div>
            </div>

            <div className="card p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Food preferences</p>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Meal style</h2>
                </div>
                <Leaf className="h-5 w-5 text-emerald-500" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Diet Type</label>
                  <select name="diet_type" value={form.diet_type} onChange={handleChange} className="select-field">
                    {DIET_TYPES.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Food Preference</label>
                  <select name="food_type" value={form.food_type} onChange={handleChange} className="select-field">
                    {FOOD_TYPES.map((type) => <option key={type}>{type}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Meals Per Day</label>
                  <select name="meals_per_day" value={form.meals_per_day} onChange={handleChange} className="select-field">
                    {[2, 3, 4, 5].map((count) => (
                      <option key={count} value={count}>{count} meals</option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Allergies / intolerances</label>
                  <input
                    name="allergies"
                    value={form.allergies}
                    onChange={handleChange}
                    placeholder="e.g. nuts, gluten, dairy"
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6 h-full">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Food Budget</p>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Budget planning</h2>
                </div>
                <ShoppingCart className="h-5 w-5 text-brand-500" />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {['daily', 'weekly', 'monthly'].map((period) => (
                  <button
                    key={period}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, budget_period: period }))}
                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors ${form.budget_period === period ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300 hover:bg-surface-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800'}`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Budget amount</label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-500">₹</span>
                    <input
                      name="budget_amount"
                      value={form.budget_amount}
                      onChange={handleChange}
                      type="number"
                      min={0}
                      className="input-field pl-9"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary w-full mt-6 justify-center py-3 disabled:opacity-60"
              >
                {loading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Budget Plan…</>
                  : <><Zap className="w-4 h-4" /> Generate Budget-Based Plan</>
                }
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Budget snapshot</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cost control</h3>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">₹{dailyBudget}/day</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {budgetStats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{item.label}</p>
                  <p className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{item.value}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.detail}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                { label: 'Breakfast', value: mealCosts.breakfast },
                { label: 'Lunch', value: mealCosts.lunch },
                { label: 'Snack', value: mealCosts.snack1 + mealCosts.snack2 },
                { label: 'Dinner', value: mealCosts.dinner },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-gray-200 bg-surface-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-900">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{item.label}</p>
                  <p className="mt-2 text-base font-semibold text-gray-900 dark:text-white">₹{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {!result && !loading ? (
        <div className="card p-8 sm:p-10">
          <div className="mx-auto flex max-w-2xl flex-col items-center rounded-[2rem] border border-dashed border-brand-200 bg-brand-50/60 p-8 text-center shadow-sm dark:border-brand-900/60 dark:bg-brand-950/20">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-gray-900">
              <Salad className="h-10 w-10 text-brand-600" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-gray-900 dark:text-white">Your personalized nutrition plan will appear here.</h3>
            <p className="mt-3 max-w-lg text-sm leading-6 text-gray-600 dark:text-gray-400">
              Fill in your details, generate a budget-aware plan, and review your meals, grocery list, and savings suggestions in one polished view.
            </p>
          </div>
        </div>
      ) : loading ? (
        <div className="card p-8">
          <div className="flex items-center justify-center gap-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
            <RefreshCw className="h-5 w-5 animate-spin text-brand-600" />
            Preparing your premium nutrition plan…
          </div>
        </div>
      ) : (
        <div className="space-y-6 mt-4">
          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <div className="card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">AI nutrition plan</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Personalized guidance</h3>
                  </div>
                  <button onClick={handleDownload} className="btn-secondary text-xs px-3 py-2">
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    { label: 'Calories', value: `${calories} kcal` },
                    { label: 'Protein', value: `${proteinGrams} g` },
                    { label: 'Carbs', value: `${carbsGrams} g` },
                    { label: 'Fat', value: `${fatGrams} g` },
                  ].map((item) => (
                    <div key={item.label} className="rounded-full border border-gray-200 bg-surface-100 px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                      <div className="text-[10px] uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">{item.label}</div>
                      <div className="mt-1 text-sm text-gray-900 dark:text-white">{item.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-5">
                  <AIResponseCard content={result.guidance} timestamp={result.timestamp} />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Meal timeline</p>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Daily flow</h3>
                  </div>
                  <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">{form.meals_per_day} meals</span>
                </div>
                <div className="mt-5 space-y-3">
                  {mealTimeline.map((meal) => (
                    <div key={meal.name} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-gray-800 dark:bg-gray-900/80 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                          <meal.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-gray-900 dark:text-white">{meal.name}</p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{meal.time}</span>
                          </div>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{meal.foods.join(' • ')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 sm:flex-col sm:items-end">
                        <span>{meal.calories} kcal</span>
                        <span className="font-semibold text-gray-900 dark:text-white">₹{meal.cost}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Budget optimization</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Smart savings</h3>
                <div className="mt-4 space-y-2">
                  {optimizationCards.map((item) => (
                    <div key={item.id} className="flex items-start gap-2 rounded-2xl border border-gray-200 bg-surface-50 px-3 py-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
                      <div className="mt-0.5 rounded-full bg-brand-50 p-1 text-brand-600">
                        <item.icon className="h-3.5 w-3.5" />
                      </div>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {affordableAlternatives.length > 0 && (
                <div className="card p-6">
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Affordable alternatives</p>
                  <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Swap and save</h3>
                  <div className="mt-4 space-y-3">
                    {affordableAlternatives.map((item) => (
                      <div key={item.replace} className="rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{item.replace}</p>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">Replace → {item.with}</p>
                          </div>
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">{item.savings}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card p-6">
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Nutrition tips</p>
                <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Quick guidance</h3>
                <div className="mt-4 space-y-3">
                  {nutritionTips.map((tip) => (
                    <div key={tip.title} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-sm dark:border-gray-800 dark:bg-gray-900/80">
                      <div className="mt-0.5 rounded-full bg-brand-50 p-1.5 text-brand-600">
                        <tip.icon className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{tip.title}</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{tip.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-gray-400 dark:text-gray-500">Grocery list</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Essential staples</h3>
              </div>
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">Curated items</span>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groceryGroups.map((group) => (
                <div key={group.title} className="rounded-2xl border border-gray-200 bg-surface-50 p-4 dark:border-gray-800 dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-brand-50 p-2 text-brand-600">
                      <group.icon className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{group.title}</h4>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span key={item} className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300">
                        <ShoppingCart className="h-3 w-3" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
            AI nutrition guidance is for general wellness only. Consult a healthcare professional before starting a new diet.
          </div>
        </div>
      )}
    </div>
  )
}
