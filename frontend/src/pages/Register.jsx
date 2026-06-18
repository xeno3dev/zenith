import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Sparkles } from 'lucide-react'
import api from '../lib/api'
import useAuthStore from '../store/authStore'

export default function Register() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    school: '',
    grade_level: '',
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/register', form)
      login(res.data.user, res.data.access_token)
      toast.success('Account created! Welcome to Zenith.')
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-md bg-surface rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <Sparkles className="text-primary" size={28} />
          <h1 className="text-2xl font-extrabold text-text">Zenith</h1>
        </div>
        <h2 className="text-lg font-semibold text-center mb-6 text-text/80">
          Create your account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text/70 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-background border border-white/10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Jane Smith"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text/70 mb-1">Email</label>
            <input
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-background border border-white/10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@school.edu"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text/70 mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg bg-background border border-white/10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-text/70 mb-1">School</label>
              <input
                type="text"
                name="school"
                value={form.school}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-background border border-white/10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Optional"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text/70 mb-1">Grade Level</label>
              <input
                type="text"
                name="grade_level"
                value={form.grade_level}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg bg-background border border-white/10 text-text focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g. Form 5"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-primary text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center text-sm text-text/60 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
