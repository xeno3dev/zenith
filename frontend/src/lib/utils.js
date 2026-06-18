export function formatDate(date) {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysUntil(date) {
  if (!date) return 0
  const target = typeof date === 'string' ? new Date(date) : date
  if (isNaN(target.getTime())) return 0
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate())
  const diffMs = startOfTarget.getTime() - startOfToday.getTime()
  return Math.round(diffMs / (1000 * 60 * 60 * 24))
}

export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function gradeColor(grade) {
  if (grade === 'A' || grade === 'B') {
    return 'bg-green-500/20 text-green-400 border border-green-500/30'
  }
  if (grade === 'C' || grade === 'D') {
    return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
  }
  return 'bg-red-500/20 text-red-400 border border-red-500/30'
}
