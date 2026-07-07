/**
 * Exercise Library — browse exercises and get detailed AI-powered guides.
 */

import React, { useState } from 'react'
import { BookOpen, Search, RefreshCw, ChevronDown, Zap } from 'lucide-react'
import { getExerciseInfo } from '../services/api.js'
import AIResponseCard from '../components/AIResponseCard.jsx'
import toast from 'react-hot-toast'

const EXERCISE_CATEGORIES = {
  'Chest': ['Push-Up', 'Bench Press', 'Incline Push-Up', 'Dumbbell Fly', 'Cable Crossover', 'Diamond Push-Up'],
  'Back': ['Pull-Up', 'Bent-Over Row', 'Lat Pulldown', 'Seated Cable Row', 'Superman', 'Deadlift'],
  'Shoulders': ['Overhead Press', 'Lateral Raise', 'Front Raise', 'Face Pull', 'Arnold Press', 'Shrugs'],
  'Arms': ['Bicep Curl', 'Tricep Dip', 'Hammer Curl', 'Tricep Pushdown', 'Skull Crusher', 'Chin-Up'],
  'Core': ['Plank', 'Crunches', 'Mountain Climber', 'Russian Twist', 'Bicycle Crunch', 'Leg Raise'],
  'Legs': ['Squat', 'Lunges', 'Deadlift', 'Leg Press', 'Calf Raise', 'Bulgarian Split Squat'],
  'Cardio': ['Burpee', 'Jumping Jacks', 'High Knees', 'Jump Rope', 'Box Jump', 'Battle Ropes'],
  'Flexibility': ['Downward Dog', 'Hip Flexor Stretch', 'Pigeon Pose', 'Cat-Cow', 'Child\'s Pose', 'World\'s Greatest Stretch'],
}

const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

export default function ExerciseLib() {
  const [searchTerm, setSearchTerm]  = useState('')
  const [selected, setSelected]      = useState(null)
  const [level, setLevel]            = useState('Beginner')
  const [expandedCat, setExpandedCat] = useState('Chest')
  const [result, setResult]          = useState(null)
  const [loading, setLoading]        = useState(false)

  const handleExerciseSelect = async (exercise) => {
    setSelected(exercise)
    setResult(null)
    setLoading(true)
    try {
      const { data } = await getExerciseInfo(exercise, level)
      setResult(data)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) handleExerciseSelect(searchTerm.trim())
  }

  // Filter categories by search term
  const filteredCategories = searchTerm.trim()
    ? Object.entries(EXERCISE_CATEGORIES).reduce((acc, [cat, exercises]) => {
        const filtered = exercises.filter((e) =>
          e.toLowerCase().includes(searchTerm.toLowerCase())
        )
        if (filtered.length) acc[cat] = filtered
        return acc
      }, {})
    : EXERCISE_CATEGORIES

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <h1 className="section-title">Exercise Library</h1>
        </div>
        <p className="section-subtitle">
          Browse 50+ exercises and get detailed AI-powered form guides, muscle targets, and variations.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-6">
        {/* Left sidebar: exercise list */}
        <div className="md:col-span-2 space-y-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search exercises…"
                className="input-field pl-9"
              />
            </div>
            <button type="submit" className="btn-primary px-3 py-2">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Level selector */}
          <div className="flex gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${level === l
                    ? 'bg-brand-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Exercise categories */}
          <div className="card overflow-hidden divide-y divide-gray-100 dark:divide-gray-800">
            {Object.entries(filteredCategories).map(([cat, exercises]) => (
              <div key={cat}>
                <button
                  onClick={() => setExpandedCat(expandedCat === cat ? null : cat)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cat}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedCat === cat ? 'rotate-180' : ''}`} />
                </button>
                {expandedCat === cat && (
                  <div className="pb-2 px-2">
                    {exercises.map((ex) => (
                      <button
                        key={ex}
                        onClick={() => handleExerciseSelect(ex)}
                        className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors
                          ${selected === ex
                            ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 font-medium'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: exercise detail */}
        <div className="md:col-span-3">
          {!selected && (
            <div className="card p-8 text-center text-gray-400 dark:text-gray-500 h-full flex flex-col items-center justify-center">
              <BookOpen className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">Select an exercise to see the full guide</p>
              <p className="text-sm mt-1">Including form cues, muscles worked, and progressions</p>
            </div>
          )}

          {loading && (
            <div className="card p-8 text-center animate-pulse">
              <Zap className="w-10 h-10 mx-auto mb-3 text-brand-400 animate-bounce" />
              <p className="font-medium text-gray-600 dark:text-gray-400">Loading {selected} guide…</p>
              <p className="text-sm text-gray-400 mt-1">IBM Granite AI is preparing the guide</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-white text-lg">{result.exercise}</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{level} Level Guide • IBM Granite AI</p>
                </div>
                <button
                  onClick={() => handleExerciseSelect(selected)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>
              <AIResponseCard content={result.info} timestamp={result.timestamp} showMeta={false} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
