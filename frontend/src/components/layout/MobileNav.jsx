import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ListTodo, Layers, Mic, Sparkles } from 'lucide-react'
import { cn } from '../../lib/utils'

const links = [
  { to: '/', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/assignments', label: 'Tasks', icon: ListTodo },
  { to: '/flashcards', label: 'Cards', icon: Layers },
  { to: '/podcasts', label: 'Pods', icon: Mic },
  { to: '/ai', label: 'More', icon: Sparkles },
]

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-surface border-t border-white/10 flex items-stretch">
      {links.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors',
              isActive ? 'text-primary bg-primary/10' : 'text-text/60'
            )
          }
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
