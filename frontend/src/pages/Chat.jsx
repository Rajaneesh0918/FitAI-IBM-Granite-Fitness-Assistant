/**
 * Chat Page — AI Fitness Coach chat interface powered by IBM Granite.
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Trash2, User, RefreshCw, Zap, MessageSquare,
  Lightbulb, ChevronRight, Sparkles, Plus, History,
  Clock3, ArrowUpRight,
} from 'lucide-react'
import { sendChatMessage } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import AIResponseCard, { TypingIndicator } from '../components/AIResponseCard.jsx'
import UserProfileModal from '../components/UserProfileModal.jsx'
import toast from 'react-hot-toast'

const QUICK_PROMPTS = [
  'Create a 4-week beginner home workout plan for weight loss',
  'Suggest a diet plan for muscle gain with 2500 calories',
  'Help me lose weight with a realistic weekly routine',
  'Build muscle with a beginner-friendly gym schedule',
  'Improve my stamina for running and cycling',
  'Create a home workout plan with no equipment',
  'Design a vegetarian diet plan for daily energy',
  'Create a budget meal plan for one week',
]

const STORAGE_KEY = 'fitai-chat-sessions'

function loadSessions() {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function getSessionTitle(text) {
  const clean = (text || 'New conversation').trim().replace(/\s+/g, ' ')
  return clean.length > 34 ? `${clean.slice(0, 34)}…` : clean
}

export default function Chat() {
  const { userProfile } = useApp()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [sessions, setSessions] = useState(loadSessions)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [messages, setMessages] = useState([])
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  }, [sessions])

  const saveSession = (sessionId, nextMessages, titleOverride) => {
    const title = titleOverride
      ? getSessionTitle(titleOverride)
      : nextMessages.find((msg) => msg.role === 'user')?.content || 'New conversation'

    setSessions((prev) => {
      const existing = prev.find((session) => session.id === sessionId)
      if (existing) {
        return prev.map((session) => (
          session.id === sessionId
            ? { ...session, title: getSessionTitle(title), updatedAt: Date.now(), messages: nextMessages }
            : session
        ))
      }

      return [{ id: sessionId, title: getSessionTitle(title), updatedAt: Date.now(), messages: nextMessages }, ...prev]
    })
  }

  const startNewConversation = () => {
    setMessages([])
    setActiveSessionId(null)
    setInput('')
    inputRef.current?.focus()
  }

  const openSession = (session) => {
    setActiveSessionId(session.id)
    setMessages(session.messages || [])
    setInput('')
  }

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Unable to copy')
    }
  }

  const handleDownload = (content) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'fitai-coach-response.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  const sendMessage = async (text) => {
    const message = (text || input).trim()
    if (!message || loading) return

    const sessionId = activeSessionId || `session-${Date.now()}`
    if (!activeSessionId) setActiveSessionId(sessionId)

    const userMessage = { id: Date.now(), role: 'user', content: message }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)

    const apiHistory = nextMessages.slice(0, -1).map(({ role, content }) => ({ role, content }))

    try {
      const { data } = await sendChatMessage(message, apiHistory, userProfile || {})
      const assistantMessage = { id: Date.now() + 1, role: 'assistant', content: data.response }
      const finalMessages = [...nextMessages, assistantMessage]
      setMessages(finalMessages)
      saveSession(sessionId, finalMessages, message)
    } catch (err) {
      const fallbackMessage = {
        id: Date.now() + 2,
        role: 'assistant',
        content: `⚠️ Error: ${err.message}\n\nMake sure the Flask backend is running on port 5000.`,
      }
      const finalMessages = [...nextMessages, fallbackMessage]
      setMessages(finalMessages)
      saveSession(sessionId, finalMessages, message)
      toast.error('Failed to reach FitAI Coach. Is the backend running?')
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleRegenerate = async () => {
    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user')
    if (!lastUserMessage) return
    await sendMessage(lastUserMessage.content)
  }

  const handleContinue = () => {
    setInput('Continue with a practical next step and tailor it to my current goal.')
    inputRef.current?.focus()
  }

  return (
    <div className="premium-page bg-surface-50 px-3 py-4 sm:px-6 sm:py-6 dark:bg-slate-950/70">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 px-4 py-4 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80 sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/20">
                <Zap className="h-6 w-6 fill-current text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">FitAI Coach</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">Premium guidance powered by IBM Granite</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowProfile(true)}
                className="btn-secondary text-xs px-3 py-2"
              >
                <User className="h-3.5 w-3.5" />
                {userProfile?.name || 'Set Profile'}
              </button>
              <button
                onClick={startNewConversation}
                className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 transition-all hover:border-brand-300 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
              >
                <Plus className="mr-1.5 inline h-3.5 w-3.5" />
                New chat
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          <div className="flex min-h-[680px] flex-col overflow-hidden rounded-[2rem] border border-gray-200/70 bg-white/80 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
            <div className="flex items-center justify-between border-b border-gray-200/70 px-4 py-4 dark:border-gray-800 sm:px-6">
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-400 dark:text-gray-500">Coach session</p>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">{messages.length > 0 ? 'Live coaching chat' : 'Your personal fitness coach'}</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-950/40 dark:text-brand-400">
                <Sparkles className="h-3.5 w-3.5" />
                AI ready
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
              {messages.length === 0 && (
                <div className="flex h-full items-center justify-center">
                  <div className="w-full max-w-2xl rounded-[2rem] border border-dashed border-brand-200 bg-brand-50/70 px-6 py-8 text-center shadow-sm dark:border-brand-900/60 dark:bg-brand-950/20 sm:px-8 sm:py-10">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-sm dark:bg-gray-900">
                      <MessageSquare className="h-10 w-10 text-brand-600" />
                    </div>
                    <h3 className="mt-6 text-2xl font-semibold text-gray-900 dark:text-white">Your Personal Fitness Coach</h3>
                    <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                      Ask anything about fitness, workouts, recovery, or nutrition and get a focused plan in seconds.
                    </p>

                    <div className="mt-6 grid gap-2 text-left sm:grid-cols-2">
                      {QUICK_PROMPTS.slice(0, 6).map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendMessage(prompt)}
                          className="group flex items-start gap-2 rounded-2xl border border-gray-200 bg-white/90 p-3 text-left text-sm text-gray-600 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400"
                        >
                          <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-brand-500 transition-transform group-hover:translate-x-0.5" />
                          <span>{prompt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((msg) => (
                  msg.role === 'user' ? (
                    <div key={msg.id} className="flex justify-end animate-slide-up">
                      <div className="max-w-[85%] rounded-[1.35rem] rounded-tr-sm bg-brand-600 px-4 py-3 text-sm leading-6 text-white shadow-sm">
                        {msg.content}
                      </div>
                      <div className="ml-3 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        <User className="h-5 w-5" />
                      </div>
                    </div>
                  ) : (
                    <AIResponseCard
                      key={msg.id}
                      content={msg.content}
                      timestamp={msg.id}
                      onCopy={handleCopy}
                      onDownload={handleDownload}
                      onRegenerate={handleRegenerate}
                      onContinue={handleContinue}
                    />
                  )
                ))}

                {loading && <TypingIndicator />}
                <div ref={bottomRef} />
              </div>
            </div>

            <div className="border-t border-gray-200/70 bg-white/80 px-3 py-3 dark:border-gray-800 dark:bg-gray-900/80 sm:px-6 sm:py-4">
              <div className="flex items-end gap-3">
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask your AI fitness coach anything…"
                    rows={1}
                    disabled={loading}
                    className="min-h-[48px] w-full resize-none rounded-[1.2rem] border border-gray-200 bg-slate-50 px-4 py-3 pr-14 text-sm leading-6 text-gray-700 shadow-sm outline-none transition-all focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:focus:border-brand-500 dark:focus:ring-brand-950"
                    style={{ height: 'auto', overflowY: input.split('\n').length > 3 ? 'scroll' : 'hidden' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto'
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                    }}
                  />
                </div>
                <button
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
              <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">
                Powered by IBM Granite • Shift+Enter for a new line
              </p>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-brand-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Suggested prompts</h3>
              </div>
              <div className="mt-4 space-y-2">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-slate-50 px-3 py-3 text-left text-sm text-gray-600 transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-300"
                  >
                    <span>{prompt}</span>
                    <ArrowUpRight className="h-4 w-4 text-brand-500" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] border border-gray-200/70 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
              <div className="flex items-center gap-2">
                <History className="h-4 w-4 text-brand-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Conversation history</h3>
              </div>
              <div className="mt-4 space-y-2">
                {sessions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                    No previous conversations yet.
                  </div>
                ) : (
                  sessions.slice(0, 8).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => openSession(session)}
                      className="flex w-full items-start gap-3 rounded-2xl border border-gray-200 bg-slate-50 px-3 py-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 dark:border-gray-700 dark:bg-gray-950"
                    >
                      <div className="mt-0.5 rounded-full bg-brand-50 p-2 text-brand-600 dark:bg-brand-950/40">
                        <Clock3 className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{session.title}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {new Date(session.updatedAt || Date.now()).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  )
}
