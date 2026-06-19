import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ListTodo, GraduationCap, BarChart3 } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'
import { formatDate, daysUntil } from '../lib/utils'

export default function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const [assignments, setAssignments] = useState([])
  const [exams, setExams] = useState([])
  const [gradeSummary, setGradeSummary] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/assignments').catch(() => ({ data: [] })),
      api.get('/exams', { params: { upcoming: true } }).catch(() => ({ data: [] })),
      api.get('/grades/summary').catch(() => ({ data: [] })),
    ])
      .then(([a, e, g]) => {
        setAssignments(a.data || [])
        setExams(e.data || [])
        setGradeSummary(g.data || [])
      })
      .finally(() => setLoading(false))
  }, [location.key])

  const assignmentsDueSoon = assignments.filter((a) => {
    const d = daysUntil(a.due_date)
    return d >= 0 && d <= 7 && a.status !== 'done'
  })

  const examsNext30 = exams.filter((e) => {
    const d = daysUntil(e.exam_date)
    return d >= 0 && d <= 30
  })

  const overallAverage = gradeSummary.length
    ? (
        gradeSummary.reduce((sum, g) => sum + (g.weighted_average || 0), 0) /
        gradeSummary.length
      ).toFixed(1)
    : null

  const recentAssignments = [...assignments]
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 5)

  const upcomingExams = [...exams]
    .sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))
    .slice(0, 5)

  const stats = [
    {
      label: 'Due this week',
      value: assignmentsDueSoon.length,
      icon: ListTodo,
      color: 'text-primary',
    },
    {
      label: 'Exams in 30 days',
      value: examsNext30.length,
      icon: GraduationCap,
      color: 'text-accent',
    },
    {
      label: 'Grade average',
      value: overallAverage !== null ? `${overallAverage}%` : '—',
      icon: BarChart3,
      color: 'text-primary',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name?.split(' ')[0] || 'Student'}
        </h1>
        <p className="text-text/60 mt-1">Here's what's happening with your studies.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-surface rounded-xl p-4">
            <Icon className={color} size={22} />
            <p className="text-2xl font-bold mt-2">{loading ? '—' : value}</p>
            <p className="text-xs text-text/60 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-surface rounded-xl p-5">
          <h2 className="font-semibold mb-4">Recent Assignments</h2>
          {recentAssignments.length === 0 ? (
            <p className="text-sm text-text/50">No assignments yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentAssignments.map((a) => (
                <li key={a.id} className="flex justify-between items-center text-sm">
                  <span className="truncate">{a.title}</span>
                  <span className="text-text/50 shrink-0 ml-2">{formatDate(a.due_date)}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            to="/assignments"
            className="inline-block mt-4 text-sm text-primary hover:underline"
          >
            View all assignments
          </Link>
        </div>

        <div className="bg-surface rounded-xl p-5">
          <h2 className="font-semibold mb-4">Upcoming Exams</h2>
          {upcomingExams.length === 0 ? (
            <p className="text-sm text-text/50">No upcoming exams.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingExams.map((e) => (
                <li key={e.id} className="flex justify-between items-center text-sm">
                  <span className="truncate">{e.title}</span>
                  <span className="text-text/50 shrink-0 ml-2">
                    {daysUntil(e.exam_date)}d
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link to="/exams" className="inline-block mt-4 text-sm text-primary hover:underline">
            View all exams
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/assignments"
          className="px-4 py-2 rounded-lg bg-primary text-background text-sm font-medium hover:opacity-90"
        >
          Add Assignment
        </Link>
        <Link
          to="/exams"
          className="px-4 py-2 rounded-lg bg-surface text-text text-sm font-medium hover:bg-white/10"
        >
          Add Exam
        </Link>
      </div>
    </div>
  )
}
