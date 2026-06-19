import { Brain, FlaskConical, FileText, RotateCcw, Trophy, Zap } from 'lucide-react'

const FEATURES = [
  { icon: Brain, label: 'Multiple Choice', desc: 'AI-generated MCQ questions from your decks' },
  { icon: FileText, label: 'Short Answer', desc: 'Open-ended questions with instant AI scoring' },
  { icon: Zap, label: 'Instant Feedback', desc: 'Know right away if you got it right' },
  { icon: RotateCcw, label: 'Retry Mode', desc: 'Drill only the questions you missed' },
  { icon: Trophy, label: 'Score History', desc: 'Track improvement over time' },
  { icon: FlaskConical, label: 'PDF Export', desc: 'Download quizzes to study offline' },
]

export default function Quiz() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Quiz</h1>
          <p className="text-text/60 mt-1">Test yourself with AI-generated questions.</p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent/20 text-accent border border-accent/30">
          In Progress
        </span>
      </div>

      <div className="bg-surface rounded-2xl p-8 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center">
          <Brain className="text-primary" size={32} />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Quiz mode is being built</h2>
          <p className="text-text/60 text-sm mt-1 max-w-sm">
            We're crafting an adaptive quiz engine that turns your flashcard decks and
            uploaded resources into smart practice sessions.
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text/60 uppercase tracking-wide mb-3">
          Coming features
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-surface rounded-xl p-4 flex gap-3 items-start opacity-70">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-text/60" />
              </div>
              <div>
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-text/50 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
