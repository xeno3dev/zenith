import { useState } from 'react'
import api from '../lib/api'
import { cn } from '../lib/utils'
import AIChat from '../components/ai/AIChat'
import QuizMode from '../components/ai/QuizMode'

const TABS = [
  { id: 'chat', label: 'Chat' },
  { id: 'explain', label: 'Explain' },
  { id: 'quiz', label: 'Quiz' },
]

function ExplainTab() {
  const [topic, setTopic] = useState('')
  const [subject, setSubject] = useState('')
  const [level, setLevel] = useState('High School')
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/ai/explain', { topic, subject, level })
      setExplanation(res.data.explanation)
    } catch {
      setError('Could not generate an explanation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="bg-surface rounded-xl p-5 space-y-3">
        <div className="grid md:grid-cols-3 gap-3">
          <input
            type="text"
            required
            placeholder="Topic (e.g. Photosynthesis)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            required
            placeholder="Subject (e.g. Biology)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="Beginner">Beginner</option>
            <option value="High School">High School</option>
            <option value="College">College</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Explaining...' : 'Explain Topic'}
        </button>
      </form>

      {loading && (
        <div className="bg-surface rounded-xl p-5 text-sm text-text/50">
          Thinking through the explanation...
        </div>
      )}

      {error && (
        <div className="bg-surface rounded-xl p-5 text-sm text-accent">{error}</div>
      )}

      {explanation && !loading && (
        <div className="bg-surface rounded-xl p-5 text-sm text-text/80 whitespace-pre-wrap">
          {explanation}
        </div>
      )}
    </div>
  )
}

export default function AIAssistant() {
  const [tab, setTab] = useState('chat')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">AI Assistant</h1>
        <p className="text-text/60 mt-1">Chat, get explanations, or quiz yourself.</p>
      </div>

      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.id ? 'bg-primary text-white' : 'bg-surface text-text/60 hover:bg-white/10'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'chat' && <AIChat />}
      {tab === 'explain' && <ExplainTab />}
      {tab === 'quiz' && <QuizMode />}
    </div>
  )
}
