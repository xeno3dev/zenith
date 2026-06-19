import { Link } from 'react-router-dom'
import {
  CalendarDays,
  ListTodo,
  GraduationCap,
  Layers,
  BarChart3,
  Mic,
  Sparkles,
  Timer,
  Paperclip,
  Brain,
  ArrowRight,
  Zap,
} from 'lucide-react'

const FEATURES = [
  {
    icon: CalendarDays,
    title: 'Smart Timetable',
    desc: 'Weekly or rotation-day schedules with configurable periods and subject colour-coding.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: ListTodo,
    title: 'Assignment Tracker',
    desc: 'Due dates, priorities, and a todo → in progress → done pipeline. Never miss a deadline.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: GraduationCap,
    title: 'Exam Countdown',
    desc: 'Tag internals, externals, and mocks. See exactly how many days you have left.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: BarChart3,
    title: 'Grade Tracker',
    desc: 'Weighted averages per subject. Know your predicted grade before results day.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Layers,
    title: 'Flashcards + SRS',
    desc: 'SM-2 spaced repetition so you review only the cards you\'re about to forget.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    desc: 'Focus sessions linked to subjects. Dashboard shows your study hours for the week.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Mic,
    title: 'AI Podcasts',
    desc: 'Turn your notes into a two-host audio episode. Study during your commute.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Sparkles,
    title: 'AI Study Assistant',
    desc: 'Claude reads your actual assignments, exams, grades, and uploaded files to help you.',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: Paperclip,
    title: 'Resource Attachments',
    desc: 'Attach PDFs, Word docs, and images to any subject, assignment, or exam. AI can read them.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
]

const STATS = [
  { value: '9+', label: 'features in one app' },
  { value: 'SM-2', label: 'spaced repetition' },
  { value: 'Claude', label: 'AI backbone' },
  { value: '0', label: 'apps you need besides this' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-text">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src="/logo.png" alt="Zenith" className="h-9 w-auto drop-shadow-[0_0_10px_rgba(255,217,61,0.4)]" />
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-text/70 hover:text-text transition-colors px-3 py-1.5"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-background hover:opacity-90 transition-opacity"
            >
              Get started free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
            <Zap size={12} />
            Hack Club Stardance · Built by Xeno Solutions
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight">
            The study companion that brings your{' '}
            <span className="text-primary">whole student life</span>{' '}
            into one app.
          </h1>

          <p className="text-xl text-text/60 max-w-2xl mx-auto leading-relaxed">
            Timetable, assignments, exams, grades, flashcards, Pomodoro, AI assistant, podcasts, and file attachments — everything you need, nothing you don't.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-background font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              Get started free
              <ArrowRight size={16} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface text-text font-semibold text-sm hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="pb-16 px-6">
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {STATS.map(({ value, label }) => (
            <div key={label} className="bg-surface rounded-xl p-4 text-center">
              <p className="text-2xl font-extrabold text-primary">{value}</p>
              <p className="text-xs text-text/50 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Screenshots */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">See it in action</h2>
            <p className="text-text/60 mt-2">Every screen, one dark theme. No clutter.</p>
          </div>

          {/* Hero screenshot */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-4">
            <img
              src="/screenshots/dashboard.png"
              alt="Zenith Dashboard"
              className="w-full"
            />
          </div>

          {/* Three smaller shots */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { src: '/screenshots/timetable.png', alt: 'Timetable — weekly or rotation mode' },
              { src: '/screenshots/ai-assistant.png', alt: 'AI Assistant — powered by Claude' },
              { src: '/screenshots/pomodoro.png', alt: 'Pomodoro — focus timer with subject tracking' },
            ].map(({ src, alt }) => (
              <div key={src} className="rounded-xl overflow-hidden border border-white/10 shadow-lg">
                <img src={src} alt={alt} className="w-full" />
                <p className="text-xs text-text/40 px-3 py-2 bg-surface">{alt}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">Everything a student needs</h2>
            <p className="text-text/60 mt-2">
              Stop switching between five apps. Zenith is all of them.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-surface rounded-2xl p-5 flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                  <Icon className={color} size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{title}</h3>
                  <p className="text-xs text-text/55 mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Spotlight */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto bg-surface rounded-3xl p-8 sm:p-12 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
            <Brain className="text-primary" size={28} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold">AI that actually knows your work</h2>
          <p className="text-text/60 max-w-xl mx-auto text-sm leading-relaxed">
            Zenith's AI assistant (powered by Claude) has real-time access to your assignments, exams, grades, study sessions, and uploaded files — so it can give answers that are actually relevant to where you are right now, not generic study advice.
          </p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            {[
              '"What homework do I have due this week?"',
              '"How are my grades looking?"',
              '"Summarise my Biology PDF"',
              '"Make flashcards from my notes"',
            ].map((q) => (
              <span
                key={q}
                className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary/80 border border-primary/20"
              >
                {q}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-32 px-6">
        <div className="max-w-xl mx-auto text-center space-y-5">
          <h2 className="text-3xl font-bold">Ready to study smarter?</h2>
          <p className="text-text/60 text-sm">
            Free to use. No credit card. Works in the browser, installable as a PWA.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-background font-semibold hover:opacity-90 transition-opacity"
          >
            Create your free account
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text/40">
          <span>© 2026 Xeno Solutions. Built for Hack Club Stardance.</span>
          <div className="flex gap-4">
            <Link to="/login" className="hover:text-text/70 transition-colors">Sign in</Link>
            <Link to="/register" className="hover:text-text/70 transition-colors">Register</Link>
            <a href="https://github.com/xeno3dev/zenith" target="_blank" rel="noopener noreferrer" className="hover:text-text/70 transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
