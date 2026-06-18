import { gradeColor, cn } from '../../lib/utils'

export default function GradeTable({ summary }) {
  if (summary.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-8 text-center text-text/50 text-sm">
        No grades recorded yet.
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10 text-text/60 text-left">
            <th className="px-4 py-3">Subject</th>
            <th className="px-4 py-3">Average</th>
            <th className="px-4 py-3">Grade</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((row) => (
            <tr key={row.subject_id} className="border-b border-white/5 last:border-0">
              <td className="px-4 py-3 font-medium">{row.subject_name}</td>
              <td className="px-4 py-3">{Number(row.weighted_average).toFixed(1)}%</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-semibold',
                    gradeColor(row.predicted_grade)
                  )}
                >
                  Grade {row.predicted_grade}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
