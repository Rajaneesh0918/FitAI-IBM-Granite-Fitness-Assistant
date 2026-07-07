import React from 'react'
import { Zap } from 'lucide-react'

export default function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="flex flex-col items-center gap-4">
        <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center animate-pulse-slow">
          <Zap className="w-8 h-8 text-white fill-current" />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">Loading FitAI…</p>
      </div>
    </div>
  )
}
