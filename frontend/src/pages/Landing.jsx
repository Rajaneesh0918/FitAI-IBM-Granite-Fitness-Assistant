/**
 * Landing Page — FitAI professional landing page with hero, features, stats.
 */

import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, MessageSquare, Dumbbell, Salad, Calculator, Activity,
  BookOpen, BarChart3, ArrowRight, CheckCircle2, Star,
  Users, TrendingUp, Shield, Sparkles, ChevronRight, Moon, Sun,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

const FEATURES = [
  { icon: MessageSquare, title: 'AI Fitness Coach',       desc: 'Chat with IBM Granite-powered AI for personalized coaching, motivation, and expert advice.',       href: '/chat',      color: 'bg-brand-500' },
  { icon: Dumbbell,      title: 'Workout Planner',        desc: 'Generate custom workout plans for home or gym, any fitness level and goal.',                       href: '/workout',   color: 'bg-accent-500' },
  { icon: Salad,         title: 'Nutrition Guidance',     desc: 'Get personalized meal plans, macro breakdowns, hydration targets, and healthy eating tips.',        href: '/nutrition', color: 'bg-teal-500' },
  { icon: Activity,      title: 'BMI Calculator',         desc: 'Calculate your BMI instantly and get AI-powered health insights and ideal weight ranges.',          href: '/bmi',       color: 'bg-blue-500' },
  { icon: Calculator,    title: 'Calorie Calculator',     desc: 'Calculate TDEE, BMR, and precise daily calorie targets based on your activity level.',              href: '/calories',  color: 'bg-purple-500' },
  { icon: BookOpen,      title: 'Exercise Library',       desc: 'Explore 50+ exercises with form guides, muscle groups, modifications, and safety tips.',            href: '/exercises', color: 'bg-pink-500' },
  { icon: BarChart3,     title: 'Progress Dashboard',     desc: 'Track your fitness journey, visualize trends, and celebrate milestones.',                          href: '/dashboard', color: 'bg-orange-500' },
]

const STATS = [
  { value: '7+', label: 'AI Features', icon: Sparkles },
  { value: '50+', label: 'Exercise Library', icon: Dumbbell },
  { value: '24/7', label: 'AI Assistance', icon: CheckCircle2 },
  { value: 'IBM', label: 'Granite Powered', icon: Shield },
]

const CAPABILITIES = [
  'Personalized workout plans (home & gym)',
  'Weight loss, gain & muscle building programs',
  'Meal plans with calorie & macro breakdowns',
  'Daily motivation & mindset coaching',
  'Exercise form guides & injury prevention',
  'Recovery advice & rest optimization',
  'Water intake & hydration recommendations',
  'Progress tracking & milestone celebration',
]

export default function Landing() {
  const { darkMode, setDarkMode } = useApp()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── Navbar ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-800' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-400">
            <Zap className="w-6 h-6 fill-current" />
            FitAI
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link to="/chat" className="btn-primary text-sm">
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-28 pb-20 px-4 bg-mesh overflow-hidden">
        {/* Decorative circles */}
        <div aria-hidden className="absolute top-20 -left-32 w-64 h-64 bg-brand-200/30 dark:bg-brand-900/20 rounded-full blur-3xl" />
        <div aria-hidden className="absolute top-10 -right-20 w-80 h-80 bg-accent-200/20 dark:bg-accent-900/10 rounded-full blur-3xl" />

        <div className="max-w-4xl mx-auto text-center relative z-10 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by IBM Watsonx.ai &amp; IBM Granite
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight text-balance mb-6">
  <span className="block">FitAI</span>
  <span className="block text-brand-500">
    AI Fitness Assistant Powered by IBM Granite
  </span>
</h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Get personalized workout plans, nutrition guidance, and expert coaching 
            from IBM Granite AI — your intelligent fitness partner available 24/7.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/chat" className="btn-primary text-base px-8 py-3">
              <MessageSquare className="w-5 h-5" />
              Chat with AI Coach
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/workout" className="btn-outline text-base px-8 py-3">
              <Dumbbell className="w-5 h-5" />
              Get Workout Plan
            </Link>
          </div>

          {/* Trust note */}
          <p className="mt-6 text-sm text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4" />
            Free forever · No account required · IBM AI powered
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900 border-y border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="animate-fade-in">
              <Icon className="w-7 h-7 text-brand-500 mx-auto mb-2" />
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Everything You Need to Get Fit</h2>
            <p className="section-subtitle max-w-xl mx-auto">
              A complete AI-powered fitness platform — from workouts and nutrition to progress tracking.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, href, color }) => (
              <Link
                key={href}
                to={href}
                className="card-hover p-6 group"
              >
                <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                <div className="flex items-center gap-1 mt-3 text-brand-600 dark:text-brand-400 text-sm font-medium">
                  Explore <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Capabilities ── */}
      <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="section-title mb-4">
              Your Complete Fitness Journey, Powered by AI
            </h2>
            <p className="section-subtitle mb-8">
              FitAI combines cutting-edge IBM Granite AI with fitness science to deliver
              coaching that adapts to your goals, level, and lifestyle.
            </p>
            <Link to="/chat" className="btn-primary">
              Start Your Journey <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <ul className="space-y-3">
            {CAPABILITIES.map((cap) => (
              <li key={cap} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-brand-500 flex-shrink-0" />
                <span className="text-sm">{cap}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-brand-500 to-brand-700 text-white text-center">
        <div className="max-w-2xl mx-auto">
          <Zap className="w-12 h-12 fill-current mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Fitness?</h2>
          <p className="text-brand-100 text-lg mb-8">
            Start chatting with your AI fitness coach right now — completely free, no sign-up needed.
          </p>
          <Link to="/chat" className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-600 font-bold rounded-xl hover:bg-brand-50 transition-colors text-base">
            <MessageSquare className="w-5 h-5" />
            Chat with FitAI Now
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      {/* ── Footer ── */}
<footer className="bg-gray-950 border-t border-gray-800">
  <div className="max-w-7xl mx-auto px-6 py-12">

    <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

      {/* Brand */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-6 h-6 text-brand-500 fill-current" />
          <h3 className="text-2xl font-bold text-white">
            FitAI
          </h3>
        </div>

        <p className="text-gray-400 text-sm leading-7">
          AI-powered fitness platform built using
          IBM Granite foundation models on
          IBM watsonx.ai.
        </p>
      </div>

      {/* Features */}
      <div>
        <h4 className="text-white font-semibold mb-4">
          Features
        </h4>

        <ul className="space-y-2 text-gray-400 text-sm">
          <li>AI Fitness Coach</li>
          <li>Workout Planner</li>
          <li>Nutrition Guidance</li>
          <li>BMI Calculator</li>
          <li>Calorie Calculator</li>
          <li>Exercise Library</li>
        </ul>
      </div>

      {/* Technologies */}
      <div>
        <h4 className="text-white font-semibold mb-4">
          Technologies
        </h4>

        <ul className="space-y-2 text-gray-400 text-sm">
          <li>IBM Granite 4</li>
          <li>IBM watsonx.ai</li>
          <li>Python Flask</li>
          <li>React + Vite</li>
          <li>REST APIs</li>
        </ul>
      </div>

      {/* Internship */}
      <div>
        <h4 className="text-white font-semibold mb-4">
          Project
        </h4>

        <p className="text-gray-400 text-sm leading-7">
          Developed for
          <br />
          IBM SkillsBuild AICTE Internship 2026
        </p>

        <div className="mt-5 inline-flex items-center px-3 py-2 rounded-full bg-brand-900/40 border border-brand-700 text-brand-300 text-xs font-medium">
          Powered by IBM Granite
        </div>
      </div>

    </div>

    <div className="border-t border-gray-800 mt-10 pt-6 text-center">

      <p className="text-sm text-gray-400">
        © 2026 <span className="text-brand-400 font-semibold">FitAI</span>.
        All Rights Reserved.
      </p>

      <p className="text-xs text-gray-500 mt-2">
        AI recommendations are intended for educational and wellness purposes only.
      </p>

    </div>

  </div>
</footer>
    </div>
  )
}
