import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarDays,
  ListTodo,
  GraduationCap,
  Layers,
  BarChart3,
  Mic,
  Sparkles,
  BookOpen,
  Timer,
  LogOut,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { cn } from '../../lib/utils'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays },
  { to: '/assignments', label: 'Assignments', icon: ListTodo },
  { to: '/exams', label: 'Exams', icon: GraduationCap },
  { to: '/flashcards', label: 'Flashcards', icon: Layers },
  { to: '/grades', label: 'Grades', icon: BarChart3 },
  { to: '/pomodoro', label: 'Pomodoro', icon: Timer },
  { to: '/podcasts', label: 'Podcasts', icon: Mic },
  { to: '/ai', label: 'AI Assistant', icon: Sparkles },
  { to: '/subjects', label: 'Subjects', icon: BookOpen },
]

function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex fixed top-0 left-0 h-full w-64 bg-surface flex-col border-r border-white/5 z-20">
      <div className="px-6 py-5 border-b border-white/5">
        <img src="/logo.png" alt="Zenith" className="h-10 w-auto drop-shadow-[0_0_12px_rgba(255,217,61,0.4)]" />
        <p className="text-xs text-text/50 mt-1">by Xeno Solutions</p>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-6 py-3 text-sm font-medium border-l-4 transition-colors',
                isActive
                  ? 'border-accent text-primary bg-primary/10'
                  : 'border-transparent text-text/70 hover:text-text hover:bg-white/5'
              )
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-semibold text-white shrink-0">
          {getInitials(user?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{user?.name || 'Student'}</p>
          <p className="text-xs text-text/50 truncate">{user?.email || ''}</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-text/50 hover:text-accent transition-colors"
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  )
}
