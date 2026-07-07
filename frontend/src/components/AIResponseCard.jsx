/**
 * AIResponseCard — renders formatted AI text responses from IBM Granite.
 * Converts markdown-like asterisks and numbered lists to styled HTML.
 */

import React from 'react'
import { Bot, Sparkles } from 'lucide-react'

function formatAIText(text) {
  if (!text) return ''
  return text
    // Bold: **text** or *text*
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    // Headings: lines starting with ##
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-brand-600 dark:text-brand-400 text-base mt-3 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm,  '<h2 class="font-bold text-brand-600 dark:text-brand-400 text-lg mt-4 mb-2">$1</h2>')
    // Bullet lists: lines starting with - or •
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc text-sm leading-relaxed">$1</li>')
    // Number lists: lines starting with digit.
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm leading-relaxed">$1</li>')
    // Horizontal rules
    .replace(/^---+$/gm, '<hr class="border-gray-200 dark:border-gray-700 my-3">')
    // Line breaks
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

export default function AIResponseCard({ content, timestamp, model, showMeta = true }) {
  return (
    <div className="flex gap-3 animate-slide-up">
      {/* Avatar */}
      <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">FitAI Coach</span>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Sparkles className="w-3 h-3" />
            IBM Granite
          </span>
        </div>

        {/* Message bubble */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
          <div
            className="prose-fit text-gray-800 dark:text-gray-200 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: formatAIText(content) }}
          />
        </div>

        {/* Metadata */}
        {showMeta && timestamp && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-1">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

/* Typing indicator used while waiting for AI response */
export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-brand-400 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">FitAI Coach is thinking…</span>
        </div>
      </div>
    </div>
  )
}
