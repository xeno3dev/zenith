import { useLocation } from 'react-router-dom'
import { Bell } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { formatDate } from '../../lib/utils'

const titles = {
  '/': 'Dashboard',
  '/timetable': 'Timetable',
  '/assignments': 'Assignments',
  '/exams': 'Exams',
  '/flashcards': 'Flashcards',
  '/grades': 'Grades',
  '/podcasts': 'Podcasts',
  '/ai': 'AI Assistant',
}

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Header() {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const title = titles[location.pathname] || 'Zenith'

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-white/5 px-4 md:px-6 py-4 flex items-center justify-between">
      <h2 className="text-lg md:text-xl font-semibold">{title}</h2>

      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-sm text-text/60">
          {formatDate(new Date())}
        </span>
        <button className="text-text/60 hover:text-primary transition-colors">
          <Bell size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-semibold text-white">
          {getInitials(user?.name)}
        </div>
      </div>
    </header>
  )
}
