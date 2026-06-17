import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, X } from 'lucide-react'
import api from '../lib/api'
import useSubjects from '../hooks/useSubjects'
import GradeTable from '../components/grades/GradeTable'
import GradeChart from '../components/grades/GradeChart'

export default function Grades() {
  const { subjects } = useSubjects()
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    subject_id: '',
    assessment_name: '',
    score: '',
    max_score: '',
    weight: '',
    date: '',
  })

  const fetchSummary = () => {
    setLoading(true)
    api
      .get('/grades/summary')
      .then((res) => setSummary(res.data || []))
      .catch(() => setSummary([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSummary()
  }, [])

  const overallAverage = summary.length
    ? (
        summary.reduce((sum, g) => sum + (Number(g.weighted_average) || 0), 0) /
        summary.length
      ).toFixed(1)
    : null

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    api
      .post('/grades', {
        ...form,
        score: Number(form.score),
        max_score: Number(form.max_score),
        weight: Number(form.weight),
      })
      .then(() => {
        toast.success('Grade added')
        setShowForm(false)
        setForm({
          subject_id: '',
          assessment_name: '',
          score: '',
          max_score: '',
          weight: '',
          date: '',
        })
        fetchSummary()
      })
      .catch(() => toast.error('Could not add grade'))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Grades</h1>
          <p className="text-text/60 mt-1">Track your CSEC performance by subject.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'Add Grade'}
        </button>
      </div>

      <div className="bg-surface rounded-xl p-5">
        <p className="text-sm text-text/60">Overall Average</p>
        <p className="text-3xl font-bold text-primary mt-1">
          {overallAverage !== null ? `${overallAverage}%` : '—'}
        </p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-surface rounded-xl p-4 space-y-3">
          <div className="grid md:grid-cols-3 gap-3">
            <select
              name="subject_id"
              required
              value={form.subject_id}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              name="assessment_name"
              required
              placeholder="Assessment name"
              value={form.assessment_name}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="date"
              name="date"
              required
              value={form.date}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              name="score"
              required
              placeholder="Score"
              value={form.score}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              name="max_score"
              required
              placeholder="Max score"
              value={form.max_score}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              type="number"
              name="weight"
              required
              placeholder="Weight (%)"
              value={form.weight}
              onChange={handleChange}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
          >
            Save Grade
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-text/50">Loading grades...</p>
      ) : (
        <>
          <GradeChart summary={summary} />
          <GradeTable summary={summary} />
        </>
      )}
    </div>
  )
}
