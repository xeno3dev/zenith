import PeriodBlock from './PeriodBlock'

function getColumns(config) {
  if (config?.mode === 'rotate') {
    // Always "Day 1", "Day 2", … regardless of any stored labels
    return Array.from(
      { length: config.rotate_count || 6 },
      (_, i) => `Day ${i + 1}`
    )
  }
  return config?.days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
}

export default function TimetableGrid({ grid, periods, config, onCellClick }) {
  const columns = getColumns(config)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        <div
          className="grid gap-2 mb-2"
          style={{ gridTemplateColumns: `60px repeat(${columns.length}, 1fr)` }}
        >
          <div />
          {columns.map((col) => (
            <div key={col} className="text-center text-sm font-semibold text-text/70">
              {col}
            </div>
          ))}
        </div>

        {periods.map((period) => (
          <div
            key={period}
            className="grid gap-2 mb-2"
            style={{ gridTemplateColumns: `60px repeat(${columns.length}, 1fr)` }}
          >
            <div className="flex items-center justify-center text-xs text-text/50">
              P{period}
            </div>
            {columns.map((col) => (
              <PeriodBlock
                key={`${col}-${period}`}
                subject={grid[col]?.[period] || null}
                onClick={() => onCellClick(col, period)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
