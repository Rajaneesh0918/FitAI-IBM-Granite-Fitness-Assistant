import React from 'react'
import { Link } from 'react-router-dom'
import { Zap, Home } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white dark:bg-gray-950">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Zap className="w-9 h-9 text-white fill-current" />
        </div>
        <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-3">404</h1>
        <p className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">Page Not Found</p>
        <p className="text-gray-400 dark:text-gray-500 mb-8 max-w-sm">
          The page you're looking for doesn't exist. Let's get you back on track!
        </p>
        <Link to="/" className="btn-primary">
          <Home className="w-4 h-4" />
          Back to FitAI Home
        </Link>
      </div>
    </div>
  )
}
