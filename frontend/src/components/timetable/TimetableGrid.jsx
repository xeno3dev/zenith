import PeriodBlock from './PeriodBlock'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']

export default function TimetableGrid({ grid, periods, onCellClick }) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div
          className="grid gap-2 mb-2"
          style={{ gridTemplateColumns: `60px repeat(${DAYS.length}, 1fr)` }}
        >
          <div />
          {DAYS.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-text/70">
              {day}
            </div>
          ))}
        </div>

        {periods.map((period) => (
          <div
            key={period}
            className="grid gap-2 mb-2"
            style={{ gridTemplateColumns: `60px repeat(${DAYS.length}, 1fr)` }}
          >
            <div className="flex items-center justify-center text-xs text-text/50">
              P{period}
            </div>
            {DAYS.map((day) => (
              <PeriodBlock
                key={`${day}-${period}`}
                subject={grid[day]?.[period] || null}
                onClick={() => onCellClick(day, period)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
