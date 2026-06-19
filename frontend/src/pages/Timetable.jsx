import { useEffect, useState, useCallback } from 'react'
import useSubjects from '../hooks/useSubjects'
import TimetableGrid from '../components/timetable/TimetableGrid'
import SubjectPicker from '../components/timetable/SubjectPicker'
import api from '../lib/api'

const PERIODS = [1, 2, 3, 4, 5, 6, 7]

export default function Timetable() {
  const { subjects } = useSubjects()
  const [grid, setGrid] = useState({})
  const [activeCell, setActiveCell] = useState(null)

  useEffect(() => {
    api.get('/timetable')
      .then((res) => setGrid(res.data || {}))
      .catch(() => setGrid({}))
  }, [])

  const persist = useCallback((next) => {
    setGrid(next)
    api.put('/timetable', next).catch(() => {})
  }, [])

  const handleCellClick = (day, period) => {
    setActiveCell({ day, period })
  }

  const handleSelect = (subject) => {
    if (!activeCell) return
    const { day, period } = activeCell
    const next = { ...grid, [day]: { ...(grid[day] || {}) } }
    if (subject) {
      next[day][period] = subject
    } else {
      delete next[day][period]
    }
    persist(next)
    setActiveCell(null)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Timetable</h1>
        <p className="text-text/60 mt-1">Tap a slot to assign a subject.</p>
      </div>

      <div className="bg-surface rounded-xl p-4">
        <TimetableGrid grid={grid} periods={PERIODS} onCellClick={handleCellClick} />
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