/**
 * AIResponseCard — renders formatted AI text responses from IBM Granite.
 * Converts markdown-like asterisks and numbered lists to styled HTML.
 */

import React from 'react'
import { Bot, Sparkles, Copy, Download, RotateCcw, MessageSquarePlus } from 'lucide-react'

function formatAIText(text) {
  if (!text) return ''
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<strong>$1</strong>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-brand-500 dark:text-brand-400 text-base mt-3 mb-1">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-brand-500 dark:text-brand-400 text-lg mt-4 mb-2">$1</h2>')
    .replace(/^[-•] (.+)$/gm, '<li class="ml-4 list-disc text-sm leading-relaxed">$1</li>')
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm leading-relaxed">$1</li>')
    .replace(/^---+$/gm, '<hr class="border-gray-200 dark:border-gray-700 my-3">')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
}

function parseStructuredSections(text) {
  if (!text) return null

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean)
  const sections = []
  let currentSection = null

  const pushSection = () => {
    if (currentSection && currentSection.items.length) {
      sections.push(currentSection)
    }
  }

  lines.forEach((line) => {
    const headingMatch = line.match(/^(Key Advice|Action Plan|Warnings|Tips)\s*:??$/i)
    if (headingMatch) {
      pushSection()
      currentSection = { title: headingMatch[1], items: [] }
      return
    }

    if (!currentSection) return

    if (/^[-•]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      currentSection.items.push(line.replace(/^[-•]\s+/, '').replace(/^\d+\.\s+/, ''))
    } else if (line.length > 0) {
      currentSection.items.push(line)
    }
  })

  pushSection()
  return sections.length ? sections : null
}

export default function AIResponseCard({
  content,
  timestamp,
  showMeta = true,
  onCopy,
  onDownload,
  onRegenerate,
  onContinue,
}) {
  const structured = parseStructuredSections(content)

  return (
    <div className="flex gap-3 animate-slide-up">
      <div className="flex-shrink-0 h-10 w-10 rounded-2xl bg-brand-600 flex items-center justify-center shadow-sm">
        <Bot className="h-5 w-5 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-1.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">FitAI Coach</span>
          <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
            <Sparkles className="h-3 w-3" />
            IBM Granite
          </span>
        </div>

        <div className="premium-card rounded-tl-sm px-4 py-3 shadow-sm">
          {structured ? (
            <div className="space-y-3">
              {structured.map((section) => (
                <div key={section.title} className="premium-stat-card bg-surface-50 p-3 shadow-none hover:translate-y-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-400">{section.title}</p>
                  <ul className="mt-2 space-y-1.5">
                    {section.items.map((item) => (
                      <li key={`${section.title}-${item}`} className="text-sm leading-6 text-gray-700 dark:text-gray-300">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="prose-fit text-sm leading-6 text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: formatAIText(content) }}
            />
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => onCopy?.(content)} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
          <button onClick={onRegenerate} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <RotateCcw className="h-3.5 w-3.5" />
            Regenerate
          </button>
          <button onClick={() => onDownload?.(content)} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
          <button onClick={onContinue} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
            <MessageSquarePlus className="h-3.5 w-3.5" />
            Continue Chat
          </button>
        </div>

        {showMeta && timestamp && (
          <p className="mt-2 ml-1 text-xs text-gray-400 dark:text-gray-500">
            {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>
    </div>
  )
}

export function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="flex-shrink-0 h-10 w-10 rounded-2xl bg-brand-600 flex items-center justify-center shadow-sm">
        <Bot className="h-5 w-5 text-white" />
      </div>
      <div className="rounded-[1.35rem] rounded-tl-sm border border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-2 w-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
          <span className="ml-1 text-xs text-gray-400 dark:text-gray-500">FitAI Coach is thinking…</span>
        </div>
      </div>
    </div>
  )
}
