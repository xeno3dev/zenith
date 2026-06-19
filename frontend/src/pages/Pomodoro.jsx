import { useEffect, useRef, useState } from 'react'
import { Play, Pause, TimerReset } from 'lucide-react'
import useSubjects from '../hooks/useSubjects'
import api from '../lib/api'

const DEFAULT_WORK = 25
const DEFAULT_BREAK = 5

function pad(n) {
  return String(n).padStart(2, '0')
}

export default function Pomodoro() {
  const { subjects } = useSubjects()
  const [workMins, setWorkMins] = useState(DEFAULT_WORK)
  const [breakMins, setBreakMins] = useState(DEFAULT_BREAK)
  const [phase, setPhase] = useState('work')
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_WORK * 60)
  const [running, setRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [subjectId, setSubjectId] = useState('')
  const intervalRef = useRef(null)
  const workMinsRef = useRef(DEFAULT_WORK)
  const subjectIdRef = useRef('')
  const subjectsRef = useRef([])

  useEffect(() => { workMinsRef.current = workMins }, [workMins])
  useEffect(() => { subjectIdRef.current = subjectId }, [subjectId])
  useEffect(() => { subjectsRef.current = subjects }, [subjects])

  useEffect(() => {
    if (sessions === 0) return
    const sid = subjectIdRef.current ? Number(subjectIdRef.current) : null
    const sname = sid
      ? (subjectsRef.current.find((s) => s.id === sid)?.name ?? null)
      : null
    api.post('/study-sessions', {
      duration_minutes: workMinsRef.current,
      subject_id: sid,
      subject_name: sname,
    }).catch(() => {})
  }, [sessions])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            if (phase === 'work') {
              setSessions((n) => n + 1)
              setPhase('break')
              setSecondsLeft(breakMins * 60)
            } else {
              setPhase('work')
              setSecondsLeft(workMins * 60)
            }
            return 0
          }
          return s - 1
        })
      }, 1000)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, phase, workMins, breakMins])

  const handleReset = () => {
    clearInterval(intervalRef.current)
    setRunning(false)
    setPhase('work')
    setSecondsLeft(workMins * 60)
    setSessions(0)
  }

  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const total = (phase === 'work' ? workMins : breakMins) * 60
  const progress = 1 - secondsLeft / total
  const circumference = 2 * Math.PI * 44

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Pomodoro</h1>
        <p className="text-text/60 mt-1">Focus in short bursts, rest between them.</p>
      </div>

      <div className="bg-surface rounded-2xl p-8 flex flex-col items-center gap-6">
        <div className="flex gap-2">
          {['work', 'break'].map((p) => (
            <span
              key={p}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                phase === p ? 'bg-primary text-background' : 'bg-white/5 text-text/50'
              }`}
            >
              {p}
            </span>
          ))}
        </div>

        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="44" fill="none"
              stroke="#FFD93D" strokeWidth="8"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-4xl font-bold tabular-nums">{pad(mins)}:{pad(secs)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleReset}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
            title="Reset"
          >
            <TimerReset size={20} />
          </button>
          <button
            onClick={() => setRunning((r) => !r)}
            className="px-8 py-3 rounded-full bg-primary text-background font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            {running ? <Pause size={20} /> : <Play size={20} />}
            {running ? 'Pause' : 'Start'}
          </button>
        </div>

        <p className="text-sm text-text/50">
          {sessions} session{sessions !== 1 ? 's' : ''} completed
        </p>
      </div>

      <div className="bg-surface rounded-xl p-4 space-y-4">
        <h2 className="text-sm font-semibold text-text/70">Settings</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-text/50 mb-1">Work (minutes)</label>
            <input
              type="number"
              min={1} max={90}
              value={workMins}
              onChange={(e) => {
                const v = Number(e.target.value)
                setWorkMins(v)
                if (!running && phase === 'work') setSecondsLeft(v * 60)
              }}
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text/50 mb-1">Break (minutes)</label>
            <input
              type="number"
              min={1} max={30}
              value={breakMins}
              onChange={(e) => {
                const v = Number(e.target.value)
                setBreakMins(v)
                if (!running && phase === 'break') setSecondsLeft(v * 60)
              }}
              className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-text/50 mb-1">Subject (optional)</label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">No subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
