export default function GradeChart({ summary }) {
  if (summary.length === 0) {
    return null
  }

  return (
    <div className="bg-surface rounded-xl p-5">
      <h3 className="font-semibold mb-4">Subject Averages</h3>
      <div className="flex items-end gap-4 h-48 overflow-x-auto">
        {summary.map((row) => {
          const value = Math.max(0, Math.min(100, Number(row.weighted_average) || 0))
          return (
            <div key={row.subject_id} className="flex flex-col items-center justify-end h-full">
              <span className="text-xs text-text/70 mb-1">{value.toFixed(0)}%</span>
              <div
                className="w-12 bg-primary rounded-t-md transition-all duration-300"
                style={{ height: `${value}%` }}
              />
              <span className="text-xs text-text/50 mt-2 max-w-[60px] text-center truncate">
                {row.subject_name}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
