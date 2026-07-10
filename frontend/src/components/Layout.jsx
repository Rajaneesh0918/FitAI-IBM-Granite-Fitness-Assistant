/**
 * Layout — persistent navigation bar + footer wrapper for all app pages.
 * Phase 1: Updated to IBM Blue design system with modern SaaS-style header.
 */

import React, { useState } from 'react'
import { Outlet, NavLink, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import {
  Dumbbell, MessageSquare, Salad, Calculator, Activity,
  BookOpen, BarChart3, Sun, Moon, Menu, X, Zap,
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/chat',      label: 'AI Coach',      icon: MessageSquare },
  { to: '/workout',   label: 'Workouts',      icon: Dumbbell },
  { to: '/nutrition', label: 'Nutrition',     icon: Salad },
  { to: '/bmi',       label: 'BMI',           icon: Activity },
  { to: '/calories',  label: 'Calories',      icon: Calculator },
  { to: '/exercises', label: 'Exercises',     icon: BookOpen },
  { to: '/dashboard', label: 'Dashboard',     icon: BarChart3 },
]

export default function Layout() {
  const { darkMode, setDarkMode } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2 font-bold text-xl text-brand-500 dark:text-brand-400 shrink-0"
            >
              <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white fill-current" />
              </div>
              FitAI
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150
                    ${isActive
                      ? 'bg-brand-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-surface-100 dark:hover:bg-gray-800'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-surface-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 pb-4 pt-2 space-y-0.5 animate-fade-in">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                  ${isActive
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-surface-100 dark:hover:bg-gray-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 bg-surface-50 dark:bg-slate-950">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-500 rounded-md flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white fill-current" />
            </div>
            <span className="font-bold text-sm text-brand-500 dark:text-brand-400">FitAI</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              — Powered by IBM Watsonx.ai &amp; IBM Granite
            </span>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center sm:text-right max-w-sm">
            AI responses are for general wellness only. Always consult a healthcare professional before starting any fitness or diet program.
          </p>
        </div>
      </footer>
    </div>
  )
}
