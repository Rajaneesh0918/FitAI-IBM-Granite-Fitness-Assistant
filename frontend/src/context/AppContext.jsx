/**
 * AppContext — global state for dark mode, user profile, and fitness data.
 */

import React, { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  // ── Dark mode ──────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem('fitai-dark-mode')
    if (stored !== null) return stored === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('fitai-dark-mode', darkMode)
  }, [darkMode])

  // ── User profile ───────────────────────────────────────────────────────
  const [userProfile, setUserProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('fitai-user-profile')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const saveUserProfile = (profile) => {
    setUserProfile(profile)
    localStorage.setItem('fitai-user-profile', JSON.stringify(profile))
  }

  // ── Progress data ──────────────────────────────────────────────────────
  const [progressData, setProgressData] = useState(() => {
    try {
      const stored = localStorage.getItem('fitai-progress')
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  const addProgressEntry = (entry) => {
    const newData = [...progressData, { ...entry, date: new Date().toISOString() }]
    setProgressData(newData)
    localStorage.setItem('fitai-progress', JSON.stringify(newData))
  }

  // ── Chat history ───────────────────────────────────────────────────────
  const [chatHistory, setChatHistory] = useState([])

  const addChatMessage = (role, content) => {
    setChatHistory((prev) => [...prev, { role, content, id: Date.now() }])
  }

  const clearChatHistory = () => setChatHistory([])

  return (
    <AppContext.Provider value={{
      darkMode, setDarkMode,
      userProfile, saveUserProfile,
      progressData, addProgressEntry,
      chatHistory, addChatMessage, clearChatHistory,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
