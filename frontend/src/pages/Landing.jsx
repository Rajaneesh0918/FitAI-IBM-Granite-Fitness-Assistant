/**
 * Landing Page — FitAI v2.0 premium redesign.
 * Existing: darkMode toggle, scrolled navbar, all Link routes preserved.
 * New: hero split layout, feature cards, dashboard preview, IBM Granite section,
 *      testimonials, CTA band, polished footer.
 * No backend, API, routing, state, or business logic changes.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Zap, MessageSquare, Dumbbell, Salad, Calculator, Activity,
  BookOpen, BarChart3, ArrowRight, CheckCircle2,
  Shield, Sparkles, ChevronRight, Moon, Sun,
  TrendingUp, Target, Droplets, Brain, Star,
  Play, Users, Award, Clock,
} from 'lucide-react'
import { useApp } from '../context/AppContext.jsx'

// ── Feature cards data (existing routes preserved) ────────────────────────
const FEATURES = [
  {
    icon: MessageSquare,
    title: 'AI Coach',
    desc:  'Chat with IBM Granite-powered AI for personalised coaching, motivation, and expert guidance.',
    href:  '/chat',
    iconBg: 'bg-brand-100 dark:bg-brand-950',
    iconColor: 'text-brand-600 dark:text-brand-400',
  },
  {
    icon: Dumbbell,
    title: 'Workout Planner',
    desc:  'Generate custom workout plans for home or gym, any fitness level and goal.',
    href:  '/workout',
    iconBg: 'bg-purple-100 dark:bg-purple-950',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    icon: Salad,
    title: 'Nutrition Planner',
    desc:  'Get personalised meal plans, macro breakdowns, hydration targets, and healthy eating tips.',
    href:  '/nutrition',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Activity,
    title: 'BMI Calculator',
    desc:  'Calculate your BMI instantly and receive AI-powered health insights and ideal weight ranges.',
    href:  '/bmi',
    iconBg: 'bg-sky-100 dark:bg-sky-950',
    iconColor: 'text-sky-600 dark:text-sky-400',
  },
  {
    icon: Calculator,
    title: 'Calorie Calculator',
    desc:  'Calculate TDEE, BMR, and precise daily calorie targets based on your activity level.',
    href:  '/calories',
    iconBg: 'bg-orange-100 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
  },
  {
    icon: BookOpen,
    title: 'Exercise Library',
    desc:  'Explore 50+ exercises with form guides, muscle groups, modifications, and safety tips.',
    href:  '/exercises',
    iconBg: 'bg-rose-100 dark:bg-rose-950',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    icon: BarChart3,
    title: 'Progress Tracking',
    desc:  'Track your fitness journey, visualise trends, and celebrate milestones.',
    href:  '/dashboard',
    iconBg: 'bg-amber-100 dark:bg-amber-950',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    icon: Brain,
    title: 'AI Reports',
    desc:  'Get AI-generated daily motivation, recovery advice, and personalised health insights.',
    href:  '/chat',
    iconBg: 'bg-indigo-100 dark:bg-indigo-950',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
  },
]

// ── Capabilities list (unchanged) ─────────────────────────────────────────
const CAPABILITIES = [
  'Personalised workout plans (home & gym)',
  'Weight loss, gain & muscle building programs',
  'Meal plans with calorie & macro breakdowns',
  'Daily motivation & mindset coaching',
  'Exercise form guides & injury prevention',
  'Recovery advice & rest optimisation',
  'Water intake & hydration recommendations',
  'Progress tracking & milestone celebration',
]

// ── Testimonials ──────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name:   'Arjun R.',
    role:   'Weight Loss Journey',
    rating: 5,
    quote:  'FitAI changed the way I approach fitness. The AI coach is amazing!',
    initials: 'AR',
    hue: 220,
  },
  {
    name:   'Sneha M.',
    role:   'Fitness Enthusiast',
    rating: 5,
    quote:  'The personalised diet and workout plans are super effective. I lost 8 kg in 3 months!',
    initials: 'SM',
    hue: 150,
  },
  {
    name:   'Rahul K.',
    role:   'Muscle Building',
    rating: 5,
    quote:  'Finally, a fitness platform that understands me! The IBM Granite AI is genuinely helpful.',
    initials: 'RK',
    hue: 270,
  },
]

// ── IBM Granite info ──────────────────────────────────────────────────────
const GRANITE_FEATURES = [
  { icon: Brain,       title: 'Foundation Models',   desc: 'Built on IBM Granite — enterprise-grade AI foundation models.' },
  { icon: Target,      title: 'Personalised Plans',  desc: 'Every recommendation adapts to your unique profile and goals.' },
  { icon: Shield,      title: 'Trusted AI',          desc: 'IBM\'s responsible AI principles ensure safe, reliable responses.' },
  { icon: TrendingUp,  title: 'Continuous Learning',  desc: 'AI improves recommendations as you log more data.' },
]

// ── Mini metric card for hero illustration ────────────────────────────────
function MetricCard({ icon: Icon, iconColor, label, value, sub, barColor, barPct }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-card-md border border-gray-100 dark:border-gray-800 min-w-[130px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
      </div>
      <p className="text-xl font-bold text-gray-900 dark:text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      {barColor && (
        <div className="mt-2.5 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${barPct}%` }} />
        </div>
      )}
    </div>
  )
}

// ── Scroll-reveal hook ────────────────────────────────────────────────────
function useScrollReveal() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.12 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, visible]
}

// ── Reveal wrapper ────────────────────────────────────────────────────────
function Reveal({ children, delay = 0, className = '' }) {
  const [ref, visible] = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

// ── Avatar SVG (matches Dashboard GeneratedAvatar style) ─────────────────
function Avatar({ initials, hue, size = 38 }) {
  const bg1 = `hsl(${hue}, 62%, 52%)`
  const bg2 = `hsl(${(hue + 40) % 360}, 68%, 36%)`
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <defs>
        <linearGradient id={`avG${hue}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg1} />
          <stop offset="100%" stopColor={bg2} />
        </linearGradient>
        <clipPath id={`avC${hue}`}><rect width={size} height={size} rx="10" ry="10" /></clipPath>
      </defs>
      <rect width={size} height={size} rx="10" ry="10" fill={`url(#avG${hue})`} clipPath={`url(#avC${hue})`} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        fill="white" fontSize={size * 0.35} fontWeight="700"
        fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
        {initials}
      </text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────
export default function Landing() {
  // ── Existing state — UNCHANGED ────────────────────────────────────────
  const { darkMode, setDarkMode } = useApp()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="premium-page min-h-screen bg-white dark:bg-slate-950 overflow-x-hidden">

      {/* ══════════════════════════════════════════════════════════
          NAVBAR — sticky, glass on scroll
      ══════════════════════════════════════════════════════════ */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 shadow-card'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2 font-bold text-xl text-brand-600 dark:text-brand-400">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white fill-current" />
            </div>
            FitAI
          </div>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600 dark:text-gray-400">
            <a href="#features"   className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
            <a href="#dashboard"  className="hover:text-gray-900 dark:hover:text-white transition-colors">Dashboard</a>
            <a href="#ibm"        className="hover:text-gray-900 dark:hover:text-white transition-colors">IBM Granite</a>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg text-gray-500 hover:bg-surface-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <Link to="/chat" className="btn-primary text-sm px-4 py-2">
              Start Free <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════
          HERO — split layout: text left, metric illustration right
      ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-16 sm:pt-28 sm:pb-20 overflow-hidden bg-white dark:bg-gray-950">
        {/* Soft background blobs — emerald health tone */}
        <div aria-hidden className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-3xl opacity-60 translate-x-1/2 -translate-y-1/4 pointer-events-none" />
        <div aria-hidden className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-50 dark:bg-emerald-950/20 rounded-full blur-3xl opacity-40 -translate-x-1/3 translate-y-1/4 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* ── Left: Text ── */}
            <div className="animate-fade-in">
              {/* IBM badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by IBM Granite &amp; Watsonx.ai
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-gray-900 dark:text-white leading-[1.12] tracking-tight mb-5">
                Your AI-Powered<br />
                <span className="text-brand-500">Fitness</span> Companion
              </h1>

              <p className="text-base sm:text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-lg mb-8">
                FitAI uses advanced AI to create personalised workout plans, diet recommendations,
                and health insights — all tailored just for you, powered by IBM Granite.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  to="/chat"
                  className="btn-primary text-sm px-6 py-3 justify-center sm:justify-start"
                >
                  Start Your Fitness Journey
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/chat"
                  className="btn-outline text-sm px-6 py-3 justify-center sm:justify-start"
                >
                  Try AI Coach
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Trust pills */}
              <div className="flex flex-wrap gap-4 text-xs text-gray-400 dark:text-gray-500">
                {[
                  { icon: Shield,       text: 'AI-Powered'   },
                  { icon: Target,       text: 'Personalised' },
                  { icon: CheckCircle2, text: 'Science Based' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="font-medium text-gray-500 dark:text-gray-400">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Metric illustration ── */}
            <div className="relative flex justify-center lg:justify-end animate-slide-up">
              {/* Central hero card */}
              <div className="relative w-full max-w-sm lg:max-w-md">
                {/* Main card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-card-lg border border-gray-100 dark:border-gray-800 p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
                      <Zap className="w-4.5 h-4.5 text-white fill-current" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">FitAI Dashboard</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Daily Overview</p>
                    </div>
                    <div className="ml-auto w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>

                  {/* Metric row */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <MetricCard
                      icon={Flame}   iconColor="text-orange-500"
                      label="Calories" value="1,500" sub="/ 2,000 kcal"
                      barColor="bg-orange-400" barPct={75}
                    />
                    <MetricCard
                      icon={Dumbbell} iconColor="text-purple-500"
                      label="Workouts" value="2" sub="This Week"
                      barColor="bg-purple-400" barPct={40}
                    />
                    <MetricCard
                      icon={Scale}   iconColor="text-emerald-500"
                      label="Weight" value="72 kg" sub="Latest"
                    />
                    <MetricCard
                      icon={Droplets} iconColor="text-sky-500"
                      label="Hydration" value="2.5 L" sub="/ 3.0 L"
                      barColor="bg-sky-400" barPct={83}
                    />
                  </div>

                  {/* Mini chart placeholder */}
                  <div className="bg-surface-50 dark:bg-gray-800/60 rounded-xl p-3 flex items-end gap-1 h-16">
                    {[35, 55, 42, 68, 52, 75, 62, 80, 70, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-brand-400 dark:bg-brand-600 rounded-sm opacity-70"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2 text-center">Weekly Progress Trend</p>
                </div>

                {/* Floating badge — IBM Granite */}
                <div className="absolute -top-4 -right-4 bg-emerald-600 text-white rounded-2xl px-3 py-2 shadow-card-lg text-xs font-semibold flex items-center gap-1.5 z-20">
                  <Sparkles className="w-3.5 h-3.5" />
                  IBM Granite
                </div>

                {/* Floating stat — AI powered */}
                <div className="absolute -bottom-3 -left-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-3 py-2.5 shadow-card-md flex items-center gap-2 z-20">
                  <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-950 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-200">AI Insights</p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500">Personalised 24/7</p>
                  </div>
                </div>
              </div>
            </div>

          </div>{/* end grid */}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════════ */}
      <section className="border-y border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: '7+',   label: 'AI Features',      icon: Sparkles,     color: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-100 dark:border-emerald-900'  },
              { value: '50+',  label: 'Exercises',         icon: Dumbbell,     color: 'text-purple-500',  iconBg: 'bg-purple-50 dark:bg-purple-950 border-purple-100 dark:border-purple-900'  },
              { value: '24/7', label: 'AI Assistance',     icon: Clock,        color: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-100 dark:border-emerald-900' },
              { value: 'IBM',  label: 'Granite Powered',   icon: Shield,       color: 'text-brand-600',   iconBg: 'bg-brand-50 dark:bg-brand-950 border-brand-100 dark:border-brand-900'     },
            ].map(({ value, label, icon: Icon, color, iconBg }) => (
              <Reveal key={label}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-10 h-10 rounded-xl border shadow-card flex items-center justify-center mb-1 ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FEATURE CARDS
      ══════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-24 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">
                Everything in One Place
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                All the Tools You Need to Achieve<br className="hidden sm:block" /> Your Fitness Goals
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
                A complete AI-powered fitness platform — from workouts and nutrition to progress tracking, powered by IBM Granite.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, href, iconBg, iconColor }, i) => (
              <Reveal key={href + title} delay={i * 50}>
                <Link
                  to={href}
                  className="group block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-card hover:shadow-card-md hover:-translate-y-1 transition-all duration-200"
                >
                  <div className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className={`w-5.5 h-5.5 ${iconColor}`} />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1.5">{title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3">{desc}</p>
                  <div className="flex items-center gap-0.5 mt-3 text-brand-500 dark:text-brand-400 text-xs font-semibold">
                    Explore
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          DASHBOARD PREVIEW
      ══════════════════════════════════════════════════════════ */}
      <section id="dashboard" className="py-20 sm:py-24 px-4 bg-emerald-50/40 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Text side */}
            <Reveal>
              <div>
                <p className="text-sm font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest mb-3">
                  Smart Dashboard
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                  Track. Analyse.<br />
                  <span className="text-brand-500">Improve.</span>
                </h2>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-6 max-w-md">
                  Get a complete overview of your fitness journey with real-time insights and
                  AI-powered recommendations from IBM Granite.
                </p>

                <ul className="space-y-3 mb-8">
                  {[
                    'Real-time progress tracking',
                    'AI-powered insights & motivation',
                    'Personalised recommendations',
                    'Beautiful data visualisations',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-950 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>

                <Link to="/dashboard" className="btn-outline text-sm px-6 py-2.5">
                  Explore Dashboard <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>

            {/* Dashboard mockup */}
            <Reveal delay={100}>
              <div className="relative">
                {/* Outer glow — emerald health accent */}
                <div aria-hidden className="absolute inset-0 bg-emerald-100 dark:bg-emerald-950/30 rounded-3xl blur-2xl scale-105 opacity-40" />

                <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-card-lg overflow-hidden">
                  {/* Fake browser bar */}
                  <div className="flex items-center gap-1.5 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-surface-50 dark:bg-gray-800/60">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <div className="flex-1 mx-3 bg-gray-100 dark:bg-gray-700 rounded-md h-5 flex items-center px-2">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">fitai.app/dashboard</span>
                    </div>
                  </div>

                  {/* Dashboard preview content */}
                  <div className="p-5">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Good Morning</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Ready to crush your goals? 👋</p>
                      </div>
                      <div className="w-8 h-8 bg-brand-500 rounded-xl flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white fill-current" />
                      </div>
                    </div>

                    {/* Stat cards mini */}
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {[
                        { label: 'Calories', val: '1,500', color: 'bg-orange-100 dark:bg-orange-950', icon: '🔥' },
                        { label: 'Workouts', val: '2',     color: 'bg-purple-100 dark:bg-purple-950', icon: '💪' },
                        { label: 'Weight',   val: '72 kg', color: 'bg-emerald-100 dark:bg-emerald-950', icon: '⚖️' },
                        { label: 'Water',    val: '2.5 L', color: 'bg-sky-100 dark:bg-sky-950',     icon: '💧' },
                      ].map(({ label, val, color, icon }) => (
                        <div key={label} className={`${color} rounded-xl p-2.5`}>
                          <span className="text-base">{icon}</span>
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-1 leading-tight">{val}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">{label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Mini charts placeholder */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-surface-50 dark:bg-gray-800/60 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Weight Trend</p>
                        <div className="flex items-end gap-0.5 h-10">
                          {[55, 48, 62, 50, 70, 58, 75, 65, 80, 72].map((h, i) => (
                            <div key={i} className="flex-1 bg-brand-400 dark:bg-brand-600 rounded-sm" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                      <div className="bg-surface-50 dark:bg-gray-800/60 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-2">Calorie Intake</p>
                        <div className="flex items-end gap-0.5 h-10">
                          {[60, 72, 55, 80, 65, 88, 70, 82, 68, 90].map((h, i) => (
                            <div key={i} className="flex-1 bg-emerald-400 dark:bg-emerald-600 rounded-sm" style={{ height: `${h}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Motivation strip */}
                    <div className="mt-3 bg-brand-50 dark:bg-brand-950/50 border border-brand-100 dark:border-brand-900 rounded-xl px-3 py-2 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
                      <p className="text-[11px] text-brand-700 dark:text-brand-300 italic">
                        "The only bad workout is the one that didn't happen." — IBM Granite AI
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CAPABILITIES — two column
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <div>
                <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">
                  Complete Fitness Journey
                </p>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                  AI That Adapts to Your Goals
                </h2>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                  FitAI combines IBM Granite AI with fitness science to deliver coaching
                  that adapts to your goals, level, and lifestyle — available 24/7.
                </p>
                <Link to="/chat" className="btn-primary text-sm px-6 py-3">
                  Start Your Journey <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <ul className="space-y-3">
                {CAPABILITIES.map((cap, i) => (
                  <li key={cap} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{cap}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          IBM GRANITE SECTION
      ══════════════════════════════════════════════════════════ */}
      <section id="ibm" className="py-20 sm:py-24 px-4 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">
                IBM Granite Technology
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight mb-4">
                Built on Enterprise-Grade AI
              </h2>
              <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto leading-relaxed">
                Every recommendation, plan, and insight in FitAI is generated by IBM Granite —
                IBM's family of foundation models, running on IBM Watsonx.ai.
              </p>
            </div>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {GRANITE_FEATURES.map(({ icon: Icon, title, desc }, i) => (
              <Reveal key={title} delay={i * 60}>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-card hover:shadow-card-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-2">{title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* IBM brand strip */}
          <Reveal delay={160}>
            <div className="mt-10 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-card">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Zap className="w-6 h-6 text-white fill-current" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">IBM Granite Foundation Models</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    Running on IBM Watsonx.ai · IBM SkillsBuild AICTE Internship 2026
                  </p>
                </div>
              </div>
              <Link to="/chat" className="btn-primary text-sm px-6 py-2.5 shrink-0">
                Try IBM Granite AI <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-3">
                Loved by Fitness Enthusiasts
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
                See what users say about FitAI
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, role, rating, quote, initials, hue }, i) => (
              <Reveal key={name} delay={i * 70}>
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-card hover:shadow-card-md transition-shadow duration-200 flex flex-col gap-4">
                  {/* Stars */}
                  <div className="flex gap-0.5">
                    {Array.from({ length: rating }).map((_, j) => (
                      <Star key={j} className="w-4 h-4 text-amber-400 fill-current" />
                    ))}
                  </div>
                  {/* Quote */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed flex-1">
                    "{quote}"
                  </p>
                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gray-50 dark:border-gray-800">
                    <Avatar initials={initials} hue={hue} size={38} />
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          CTA BAND
      ══════════════════════════════════════════════════════════ */}
      <section className="py-16 px-4 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            {/* CTA card — emerald health gradient, not solid IBM Blue */}
            <div className="relative rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #15803d 0%, #16a34a 55%, #14532d 100%)' }}>
              {/* Subtle highlight */}
              <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08)_0,transparent_55%)] pointer-events-none" />
              <div aria-hidden className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />

              <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 px-8 py-10">
                <div className="text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                      <Zap className="w-4 h-4 text-white fill-current" />
                    </div>
                    <span className="text-white/80 text-sm font-medium">FitAI</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
                    Ready to Transform Your Health with AI?
                  </h2>
                  <p className="text-emerald-100 text-sm">
                    Join thousands of users achieving their fitness goals with FitAI.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 shrink-0">
                  <Link
                    to="/chat"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white text-emerald-700 font-bold rounded-xl hover:bg-emerald-50 active:scale-[0.97] transition-all duration-150 text-sm shadow-card-md"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    to="/workout"
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-white/15 text-white font-semibold rounded-xl hover:bg-white/25 active:scale-[0.97] border border-white/30 transition-all duration-150 text-sm"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          FOOTER — polished dark
      ══════════════════════════════════════════════════════════ */}
      {/* ── FOOTER — light, premium health platform ── */}
      <footer className="bg-surface-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white fill-current" />
                </div>
                <span className="text-xl font-bold text-gray-900 dark:text-white">FitAI</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-7">
                AI-powered fitness platform built using IBM Granite foundation models
                on IBM Watsonx.ai.
              </p>
            </div>

            {/* Features */}
            <div>
              <h4 className="text-gray-800 dark:text-white font-semibold mb-4 text-sm">Features</h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'AI Fitness Coach',    href: '/chat'      },
                  { label: 'Workout Planner',      href: '/workout'   },
                  { label: 'Nutrition Guidance',   href: '/nutrition' },
                  { label: 'BMI Calculator',       href: '/bmi'       },
                  { label: 'Calorie Calculator',   href: '/calories'  },
                  { label: 'Exercise Library',     href: '/exercises' },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link to={href} className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 text-sm transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Technologies */}
            <div>
              <h4 className="text-gray-800 dark:text-white font-semibold mb-4 text-sm">Technologies</h4>
              <ul className="space-y-2.5 text-gray-500 dark:text-gray-400 text-sm">
                {['IBM Granite 4', 'IBM Watsonx.ai', 'Python Flask', 'React + Vite', 'REST APIs'].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>

            {/* Project */}
            <div>
              <h4 className="text-gray-800 dark:text-white font-semibold mb-4 text-sm">Project</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-7 mb-4">
                Developed for<br />IBM SkillsBuild AICTE Internship 2026
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by IBM Granite
              </div>
            </div>

          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-500 dark:text-gray-500">
              © 2026 <span className="text-emerald-600 dark:text-emerald-400 font-semibold">FitAI</span>. All Rights Reserved.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600 text-center sm:text-right">
              AI recommendations are for educational and wellness purposes only.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ── Flame icon (not in existing lucide import set) ────────────────────────
function Flame(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
    </svg>
  )
}

// ── Scale icon ────────────────────────────────────────────────────────────
function Scale(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/>
      <path d="M7 21h10"/>
      <path d="M12 3v18"/>
      <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>
    </svg>
  )
}
