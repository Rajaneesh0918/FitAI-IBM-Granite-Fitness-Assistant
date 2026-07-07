import React, { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AppProvider } from './context/AppContext.jsx'
import Layout from './components/Layout.jsx'
import PageLoader from './components/PageLoader.jsx'

// Lazy-loaded pages for code splitting
const Landing        = lazy(() => import('./pages/Landing.jsx'))
const Chat           = lazy(() => import('./pages/Chat.jsx'))
const WorkoutPlanner = lazy(() => import('./pages/WorkoutPlanner.jsx'))
const Nutrition      = lazy(() => import('./pages/Nutrition.jsx'))
const BMICalculator  = lazy(() => import('./pages/BMICalculator.jsx'))
const CalorieCalc    = lazy(() => import('./pages/CalorieCalc.jsx'))
const ExerciseLib    = lazy(() => import('./pages/ExerciseLib.jsx'))
const Dashboard      = lazy(() => import('./pages/Dashboard.jsx'))
const NotFound       = lazy(() => import('./pages/NotFound.jsx'))

export default function App() {
  return (
    <AppProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', fontSize: '14px' },
        }}
      />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Landing page — no layout wrapper */}
          <Route path="/" element={<Landing />} />

          {/* App pages — wrapped in Layout (nav + footer) */}
          <Route element={<Layout />}>
            <Route path="/chat"          element={<Chat />} />
            <Route path="/workout"       element={<WorkoutPlanner />} />
            <Route path="/nutrition"     element={<Nutrition />} />
            <Route path="/bmi"           element={<BMICalculator />} />
            <Route path="/calories"      element={<CalorieCalc />} />
            <Route path="/exercises"     element={<ExerciseLib />} />
            <Route path="/dashboard"     element={<Dashboard />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppProvider>
  )
}
