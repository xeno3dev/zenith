import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Plus, X } from 'lucide-react'
import api from '../lib/api'
import useSubjects from '../hooks/useSubjects'
import { formatDate, daysUntil, cn } from '../lib/utils'

export default function Exams() {
  const { subjects } = useSubjects()
  const [exams, setExams] = useState([])
  const [loading, setLoading] = useState(true)
  const [upcomingOnly, setUpcomingOnly] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    subject_id: '',
    exam_date: '',
    exam_type: 'internal',
    notes: '',
  })

  const subjectsById = useMemo(() => {
    const map = {}
    subjects.forEach((s) => (map[s.id] = s))
    return map
  }, [subjects])

  const fetchExams = (upcoming) => {
    setLoading(true)
    api
      .get('/exams', { params: upcoming ? { upcoming: true } : {} })
      .then((res) => setExams(res.data || []))
      .catch(() => setExams([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchExams(upcomingOnly)
  }, [upcomingOnly])

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    api
      .post('/exams', { ...form, subject_id: form.subject_id || null })
      .then((res) => {
        setExams((prev) => [...prev, res.data])
        toast.success('Exam added')
        setShowForm(false)
        setForm({ title: '', subject_id: '', exam_date: '', exam_type: 'internal', notes: '' })
      })
      .catch(() => toast.error('Could not create exam'))
  }

  const sorted = [...exams].sort((a, b) => new Date(a.exam_date) - new Date(b.exam_date))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Exams</h1>
          <p className="text-text/60 mt-1">Stay ahead of test day.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Exam'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="text"
              name="title"
              required
              placeholder="Exam title"
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
              name="exam_date"
              required
              value={form.exam_date}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              name="exam_type"
              value={form.exam_type}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="mock">Mock Exam</option>
            </select>
          </div>
          <textarea
            name="notes"
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={handleChange}
            className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={2}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
          >
            Save Exam
          </button>
        </form>
      )}

      <button
        onClick={() => setUpcomingOnly((u) => !u)}
        className={cn(
          'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
          upcomingOnly ? 'bg-primary text-white' : 'bg-surface text-text/60 hover:bg-white/10'
        )}
      >
        {upcomingOnly ? 'Showing upcoming only' : 'Showing all exams'}
      </button>

      {loading ? (
        <p className="text-text/50 text-sm">Loading exams...</p>
      ) : sorted.length === 0 ? (
        <div className="bg-surface rounded-xl p-8 text-center text-text/50 text-sm">
          No exams found.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((exam) => {
            const days = daysUntil(exam.exam_date)
            const subject = subjectsById[exam.subject_id]
            return (
              <div key={exam.id} className="bg-surface rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm flex-1">{exam.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 shrink-0">
                    {exam.exam_type}
                  </span>
                </div>
                {subject && (
                  <span
                    className="inline-block text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${subject.color}33`, color: subject.color }}
                  >
                    {subject.name}
                  </span>
                )}
                <p className="text-xs text-text/60">
                  {formatDate(exam.exam_date)} &middot;{' '}
                  {days >= 0 ? `in ${days} day${days === 1 ? '' : 's'}` : `${Math.abs(days)} days ago`}
                </p>
                {exam.notes && <p className="text-xs text-text/50">{exam.notes}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
