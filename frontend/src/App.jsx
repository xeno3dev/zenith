import { Routes, Route, Navigate, Outlet } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Sidebar from './components/layout/Sidebar'
import Header from './components/layout/Header'
import MobileNav from './components/layout/MobileNav'

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

function ProtectedLayout() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
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
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/assignments" element={<Assignments />} />
        <Route path="/exams" element={<Exams />} />
        <Route path="/flashcards" element={<Flashcards />} />
        <Route path="/grades" element={<Grades />} />
        <Route path="/podcasts" element={<Podcasts />} />
        <Route path="/ai" element={<AIAssistant />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
