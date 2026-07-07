/**
 * UserProfileModal — collects user profile data for personalized AI coaching.
 */

import React, { useState } from 'react'
import { X, User, Save } from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const GOALS     = ['Weight Loss', 'Weight Gain', 'Muscle Gain', 'General Fitness', 'Endurance', 'Flexibility']
const LEVELS    = ['Beginner', 'Intermediate', 'Advanced']
const EQUIPMENT = ['No Equipment', 'Resistance Bands', 'Dumbbells Only', 'Full Gym']

export default function UserProfileModal({ onClose }) {
  const { userProfile, saveUserProfile } = useApp()
  const [form, setForm] = useState(userProfile || {
    name: '', age: '', gender: 'male', height: '', weight: '',
    goal: 'General Fitness', level: 'Beginner', equipment: 'No Equipment', conditions: '',
  })

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSave = () => {
    if (!form.name || !form.age || !form.height || !form.weight) {
      return alert('Please fill in Name, Age, Height, and Weight.')
    }
    saveUserProfile(form)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="card w-full max-w-lg p-6 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">Your Profile</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Personalize your AI coaching</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Name</label>
              <input name="name" value={form.name} onChange={handleChange} placeholder="Your name" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Age</label>
              <input name="age" value={form.age} onChange={handleChange} type="number" placeholder="Years" className="input-field" min="10" max="100" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className="select-field">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Height (cm)</label>
              <input name="height" value={form.height} onChange={handleChange} type="number" placeholder="175" className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Weight (kg)</label>
              <input name="weight" value={form.weight} onChange={handleChange} type="number" placeholder="70" className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fitness Goal</label>
              <select name="goal" value={form.goal} onChange={handleChange} className="select-field">
                {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Fitness Level</label>
              <select name="level" value={form.level} onChange={handleChange} className="select-field">
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Available Equipment</label>
            <select name="equipment" value={form.equipment} onChange={handleChange} className="select-field">
              {EQUIPMENT.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Health Conditions (optional)</label>
            <input name="conditions" value={form.conditions} onChange={handleChange} placeholder="e.g. lower back pain, knee injury..." className="input-field" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary flex-1">
            <Save className="w-4 h-4" />
            Save Profile
          </button>
        </div>
      </div>
    </div>
  )
}
