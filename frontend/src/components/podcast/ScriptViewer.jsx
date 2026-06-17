import { cn } from '../../lib/utils'

const SPEAKER_COLORS = {
  Ari: 'text-primary',
  Sol: 'text-accent',
}

export default function ScriptViewer({ script, currentIndex = null }) {
  if (!script || script.length === 0) {
    return <p className="text-sm text-text/50">No script available for this episode.</p>
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {script.map((line, i) => (
        <div
          key={i}
          className={cn(
            'rounded-lg px-3 py-2 transition-colors',
            currentIndex !== null && i === currentIndex ? 'bg-primary/20 ring-1 ring-primary' : ''
          )}
        >
          <span
            className={cn(
              'text-xs font-semibold uppercase mr-2',
              SPEAKER_COLORS[line.speaker] || 'text-text/60'
            )}
          >
            {line.speaker}
          </span>
          <span className="text-sm text-text/80">{line.text}</span>
        </div>
      ))}
    </div>
  )
}
