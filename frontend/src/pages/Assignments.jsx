import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import api from '../lib/api'
import useSubjects from '../hooks/useSubjects'
import AssignmentList from '../components/assignments/AssignmentList'
import { cn } from '../lib/utils'

const FILTERS = ['all', 'todo', 'in_progress', 'done']

export default function Assignments() {
  const { subjects } = useSubjects()
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    due_date: '',
    priority: 'medium',
    status: 'todo',
  })

  const subjectsById = useMemo(() => {
    const map = {}
    subjects.forEach((s) => (map[s.id] = s))
    return map
  }, [subjects])

  const fetchAssignments = () => {
    setLoading(true)
    api
      .get('/assignments')
      .then((res) => setAssignments(res.data || []))
      .catch(() => setAssignments([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  const filtered = useMemo(() => {
    if (filter === 'all') return assignments
    return assignments.filter((a) => a.status === filter)
  }, [assignments, filter])

  const handleStatusChange = (id, status) => {
    api
      .put(`/assignments/${id}`, { status })
      .then(() => {
        setAssignments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status } : a))
        )
      })
      .catch(() => toast.error('Could not update status'))
  }

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    api
      .post('/assignments', { ...form, subject_id: form.subject_id || null })
      .then((res) => {
        setAssignments((prev) => [...prev, res.data])
        toast.success('Assignment added')
        setShowForm(false)
        setForm({
          title: '',
          description: '',
          subject_id: '',
          due_date: '',
          priority: 'medium',
          status: 'todo',
        })
      })
      .catch(() => toast.error('Could not create assignment'))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Assignments</h1>
          <p className="text-text/60 mt-1">Track your homework and projects.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-background text-sm font-medium hover:opacity-90"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Assignment'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="text"
              name="title"
              required
              placeholder="Title"
              value={form.title}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              name="subject_id"
              value={form.subject_id}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="due_date"
              required
              value={form.due_date}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="low">Low priority</option>
              <option value="medium">Medium priority</option>
              <option value="high">High priority</option>
            </select>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="todo">To do</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <textarea
            name="description"
            placeholder="Description (optional)"
            value={form.description}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={2}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:opacity-90"
          >
            Save Assignment
          </button>
        </form>
      )}

      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
              filter === f ? 'bg-primary text-background' : 'bg-surface text-text/60 hover:bg-white/10'
            )}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-text/50 text-sm">Loading assignments...</p>
      ) : (
        <AssignmentList
          assignments={filtered}
          subjectsById={subjectsById}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  )
}
