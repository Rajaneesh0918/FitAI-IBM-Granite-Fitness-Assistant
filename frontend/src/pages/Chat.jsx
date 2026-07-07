/**
 * Chat Page — AI Fitness Coach chat interface powered by IBM Granite.
 */

import React, { useState, useRef, useEffect } from 'react'
import {
  Send, Trash2, User, RefreshCw, Zap, MessageSquare,
  Lightbulb, ChevronRight,
} from 'lucide-react'
import { sendChatMessage } from '../services/api.js'
import { useApp } from '../context/AppContext.jsx'
import AIResponseCard, { TypingIndicator } from '../components/AIResponseCard.jsx'
import UserProfileModal from '../components/UserProfileModal.jsx'
import toast from 'react-hot-toast'

// Quick-start prompt suggestions
const QUICK_PROMPTS = [
  'Create a 4-week beginner home workout plan for weight loss',
  'What should I eat before and after a workout?',
  'Design a push-pull-legs gym program for muscle gain',
  'How much water should I drink per day?',
  'Give me a full body HIIT workout I can do in 20 minutes',
  'What are the best exercises to strengthen my lower back?',
  'Create a 7-day meal plan for muscle gain at 2500 calories',
  'How do I break through a weight loss plateau?',
  'What is progressive overload and how do I apply it?',
  'Give me a morning routine to boost energy and metabolism',
]

export default function Chat() {
  const { chatHistory, addChatMessage, clearChatHistory, userProfile } = useApp()
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory, loading])

  const sendMessage = async (text) => {
    const message = (text || input).trim()
    if (!message || loading) return

    setInput('')
    addChatMessage('user', message)
    setLoading(true)

    try {
      // Convert chat history to API format (exclude most recent user msg)
      const apiHistory = chatHistory.map(({ role, content }) => ({ role, content }))

      const { data } = await sendChatMessage(message, apiHistory, userProfile || {})
      addChatMessage('assistant', data.response)
    } catch (err) {
      toast.error('Failed to reach FitAI Coach. Is the backend running?')
      addChatMessage('assistant', `⚠️ Error: ${err.message}\n\nMake sure the Flask backend is running on port 5000.`)
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* ── Header ── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 dark:text-white">FitAI Coach</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                IBM Granite AI • Always available
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfile(true)}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              <User className="w-3.5 h-3.5" />
              {userProfile?.name || 'Set Profile'}
            </button>
            {chatHistory.length > 0 && (
              <button
                onClick={() => { clearChatHistory(); toast.success('Chat cleared') }}
                className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-5">

          {/* Welcome screen */}
          {chatHistory.length === 0 && (
            <div className="text-center py-8 animate-fade-in">
              <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-9 h-9 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Hi{userProfile?.name ? ` ${userProfile.name}` : ''}! I'm FitAI Coach 💪
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-md mx-auto mb-8">
                Your AI-powered fitness buddy powered by IBM Granite. Ask me anything about
                workouts, nutrition, weight goals, or healthy living.
              </p>

              {/* Quick prompts */}
              <div className="text-left">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  Try asking
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {QUICK_PROMPTS.slice(0, 6).map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="flex items-start gap-2 text-left p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-700 hover:bg-brand-50 dark:hover:bg-brand-950 transition-all text-sm text-gray-600 dark:text-gray-400 group"
                    >
                      <ChevronRight className="w-4 h-4 mt-0.5 text-brand-500 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat messages */}
          {chatHistory.map((msg) => (
            msg.role === 'user' ? (
              <div key={msg.id} className="flex gap-3 justify-end animate-slide-up">
                <div className="max-w-[80%]">
                  <div className="bg-brand-500 text-white rounded-2xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed">
                    {msg.content}
                  </div>
                </div>
                <div className="flex-shrink-0 w-9 h-9 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                </div>
              </div>
            ) : (
              <AIResponseCard
                key={msg.id}
                content={msg.content}
                timestamp={msg.id}
              />
            )
          ))}

          {/* Typing indicator */}
          {loading && <TypingIndicator />}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ── */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your AI fitness coach anything… (Enter to send)"
                rows={1}
                disabled={loading}
                className="input-field resize-none min-h-[44px] max-h-32 pr-4 py-3 leading-relaxed"
                style={{ height: 'auto', overflowY: input.split('\n').length > 3 ? 'scroll' : 'hidden' }}
                onInput={(e) => {
                  e.target.style.height = 'auto'
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`
                }}
              />
            </div>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <RefreshCw className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
            Powered by IBM Granite · Not medical advice · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Profile modal */}
      {showProfile && <UserProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  )
}
