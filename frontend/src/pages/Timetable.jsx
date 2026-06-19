import { useEffect, useState, useCallback } from 'react'
import { Settings, X } from 'lucide-react'
import useSubjects from '../hooks/useSubjects'
import TimetableGrid from '../components/timetable/TimetableGrid'
import SubjectPicker from '../components/timetable/SubjectPicker'
import api from '../lib/api'

const DEFAULT_CONFIG = {
  mode: 'weekly',
  days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  periods: 7,
  rotate_count: 6,
  rotate_labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6'],
}

const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function Timetable() {
  const { subjects } = useSubjects()
  const [grid, setGrid] = useState({})
  const [config, setConfig] = useState(DEFAULT_CONFIG)
  const [activeCell, setActiveCell] = useState(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    api.get('/timetable')
      .then((res) => {
        const data = res.data || {}
        const { _config, ...cells } = data
        setGrid(cells)
        if (_config) {
          setConfig((prev) => ({ ...prev, ..._config }))
        }
      })
      .catch(() => setGrid({}))
  }, [])

  const persist = useCallback((nextGrid, nextConfig) => {
    const payload = { ...nextGrid, _config: nextConfig }
    setGrid(nextGrid)
    api.put('/timetable', payload).catch(() => {})
  }, [])

  const handleCellClick = (col, period) => {
    setActiveCell({ col, period })
  }

  const handleSelect = (subject) => {
    if (!activeCell) return
    const { col, period } = activeCell
    const next = { ...grid, [col]: { ...(grid[col] || {}) } }
    if (subject) {
      next[col][period] = subject
    } else {
      delete next[col][period]
    }
    persist(next, config)
    setActiveCell(null)
  }

  const updateConfig = (patch) => {
    const next = { ...config, ...patch }
    setConfig(next)
    persist(grid, next)
  }

  const setRotateCount = (n) => {
    const count = Math.max(2, Math.min(14, Number(n)))
    const labels = Array.from(
      { length: count },
      (_, i) => config.rotate_labels[i] ?? `Day ${i + 1}`
    )
    updateConfig({ rotate_count: count, rotate_labels: labels })
  }

  const updateRotateLabel = (idx, value) => {
    const labels = [...config.rotate_labels]
    labels[idx] = value
    updateConfig({ rotate_labels: labels })
  }

  const toggleDay = (day) => {
    const days = config.days.includes(day)
      ? config.days.filter((d) => d !== day)
      : [...config.days, day].sort((a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b))
    if (days.length === 0) return
    updateConfig({ days })
  }

  const periods = Array.from({ length: config.periods }, (_, i) => i + 1)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timetable</h1>
          <p className="text-text/60 mt-1">Tap a slot to assign a subject.</p>
        </div>
        <button
          onClick={() => setShowSettings((s) => !s)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface hover:bg-white/10 text-sm transition-colors"
        >
          {showSettings ? <X size={15} /> : <Settings size={15} />}
          {showSettings ? 'Close' : 'Settings'}
        </button>
      </div>

      {showSettings && (
        <div className="bg-surface rounded-xl p-4 space-y-4">
          <div className="flex gap-2">
            {['weekly', 'rotate'].map((m) => (
              <button
                key={m}
                onClick={() => updateConfig({ mode: m })}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  config.mode === m
                    ? 'bg-primary text-background'
                    : 'bg-white/5 text-text/60 hover:bg-white/10'
                }`}
              >
                {m === 'weekly' ? 'Mon – Fri (Weekly)' : 'Rotation Days'}
              </button>
            ))}
          </div>

          {config.mode === 'weekly' ? (
            <div>
              <p className="text-xs text-text/50 mb-2">Visible days</p>
              <div className="flex gap-2 flex-wrap">
                {ALL_DAYS.map((d) => (
                  <button
                    key={d}
                    onClick={() => toggleDay(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      config.days.includes(d)
                        ? 'bg-primary text-background'
                        : 'bg-white/5 text-text/60 hover:bg-white/10'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-xs text-text/50 shrink-0">Number of rotation days</p>
                <input
                  type="number"
                  min={2}
                  max={14}
                  value={config.rotate_count}
                  onChange={(e) => setRotateCount(e.target.value)}
                  className="w-16 px-2 py-1 rounded-lg bg-background border border-white/10 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <p className="text-xs text-text/50 mb-2">Day labels</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {config.rotate_labels.map((label, i) => (
                    <input
                      key={i}
                      type="text"
                      value={label}
                      onChange={(e) => updateRotateLabel(i, e.target.value)}
                      className="px-2 py-1 rounded-lg bg-background border border-white/10 text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <p className="text-xs text-text/50 shrink-0">Number of periods</p>
            <input
              type="number"
              min={1}
              max={12}
              value={config.periods}
              onChange={(e) => updateConfig({ periods: Math.max(1, Math.min(12, Number(e.target.value))) })}
              className="w-16 px-2 py-1 rounded-lg bg-background border border-white/10 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      )}

      <div className="bg-surface rounded-xl p-4">
        <TimetableGrid grid={grid} periods={periods} config={config} onCellClick={handleCellClick} />
      </div>

      {activeCell && (
        <SubjectPicker
          subjects={subjects}
          onSelect={handleSelect}
          onClose={() => setActiveCell(null)}
        />
      )}
    </div>
  )
}
