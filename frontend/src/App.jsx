import { useEffect } from 'react'
import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import useAuthStore from './store/authStore'
import api from './lib/api'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MobileNav from './components/layout/MobileNav'

import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Timetable from './pages/Timetable'
import Assignments from './pages/Assignments'
import Exams from './pages/Exams'
import Flashcards from './pages/Flashcards'
import Grades from './pages/Grades'
import Podcasts from './pages/Podcasts'
import AIAssistant from './pages/AIAssistant'
import Login from './pages/Login'
import Register from './pages/Register'
import Subjects from './pages/Subjects'
import Pomodoro from './pages/Pomodoro'
import Quiz from './pages/Quiz'
import Resources from './pages/Resources'
import ComingSoon from './pages/ComingSoon'

const COMING_SOON = new Set(
  (import.meta.env.VITE_COMING_SOON || '').split(',').map((s) => s.trim()).filter(Boolean)
)

/** Public root — Landing for guests, redirect to /dashboard for auth'd users */
function SmartRoot() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />
}

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <Sidebar />
      <div className="md:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  )
}

export default function App() {
  const { isAuthenticated, user, setUser } = useAuthStore()

  // On first load, if we have a token but lost the user object (e.g. old session
  // before localStorage persistence was added), re-fetch it from the server.
  useEffect(() => {
    if (isAuthenticated && !user) {
      api.get('/auth/me').then((res) => setUser(res.data)).catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route path="/" element={<SmartRoot />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/flashcards" element={COMING_SOON.has('flashcards') ? <ComingSoon /> : <Flashcards />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/podcasts" element={COMING_SOON.has('podcasts') ? <ComingSoon /> : <Podcasts />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/pomodoro" element={<Pomodoro />} />
        <Route path="/quiz" element={<Quiz />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
