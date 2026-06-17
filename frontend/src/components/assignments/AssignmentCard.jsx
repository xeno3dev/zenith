import { formatDate, daysUntil, cn } from '../../lib/utils'

const PRIORITY_COLORS = {
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-green-500/20 text-green-400 border-green-500/30',
}

const STATUSES = ['todo', 'in_progress', 'done']

export default function AssignmentCard({ assignment, subject, onStatusChange }) {
  const days = daysUntil(assignment.due_date)
  let countdownText
  if (days === 0) countdownText = 'Due today'
  else if (days > 0) countdownText = `Due in ${days} day${days === 1 ? '' : 's'}`
  else countdownText = `Overdue by ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'}`

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm flex-1">{assignment.title}</h3>
        <span
          className={cn(
            'text-xs px-2 py-0.5 rounded-full border shrink-0',
            PRIORITY_COLORS[assignment.priority] || PRIORITY_COLORS.medium
          )}
        >
          {assignment.priority || 'medium'}
        </span>
      </div>

      {assignment.description && (
        <p className="text-xs text-text/60 line-clamp-2">{assignment.description}</p>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {subject && (
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: `${subject.color}33`, color: subject.color }}
          >
            {subject.name}
          </span>
        )}
        <span className={cn('text-xs', days < 0 ? 'text-accent' : 'text-text/50')}>
          {countdownText} &middot; {formatDate(assignment.due_date)}
        </span>
      </div>

      <div className="flex gap-2 mt-1">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(assignment.id, s)}
            className={cn(
              'flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors',
              assignment.status === s
                ? 'bg-primary text-white'
                : 'bg-white/5 text-text/60 hover:bg-white/10'
            )}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  )
}
