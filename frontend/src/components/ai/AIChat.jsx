import { useEffect, useRef, useState } from 'react'
import { Send, Zap } from 'lucide-react'
import api from '../../lib/api'
import { cn } from '../../lib/utils'

// Human-readable labels for each tool the AI can call
const TOOL_LABELS = {
  get_assignments: 'Checking your assignments…',
  get_upcoming_exams: 'Looking up upcoming exams…',
  get_grades_summary: 'Fetching your grades…',
  get_due_flashcards: 'Checking flashcard review queue…',
  list_decks: 'Listing your flashcard decks…',
  create_assignment: 'Creating assignment…',
  add_flashcard: 'Adding flashcard…',
}

function ToolBadge({ tool }) {
  const label = TOOL_LABELS[tool] ?? `Running ${tool}…`
  return (
    <div className="flex items-center gap-1.5 text-xs text-text/40 my-1 pl-1">
      <Zap size={11} className="text-primary/60 shrink-0" />
      <span>{label}</span>
    </div>
  )
}

export default function AIChat() {
  // displayMessages: what is shown in the UI
  //   { role, content, actions? }  — actions are tool calls for display only
  const [displayMessages, setDisplayMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [displayMessages, loading])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { role: 'user', content: text }
    const nextDisplay = [...displayMessages, userMsg]
    setDisplayMessages(nextDisplay)
    setInput('')
    setLoading(true)

    // Only send text-role messages to the API (no action metadata)
    const apiMessages = nextDisplay
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await api.post('/ai/chat', { messages: apiMessages })
      const { reply, actions = [] } = res.data
      setDisplayMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, actions },
      ])
    } catch {
      setDisplayMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I had trouble responding. Please try again.',
          actions: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface rounded-xl flex flex-col h-[65vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {displayMessages.length === 0 && (
          <div className="text-center mt-10 space-y-2">
            <p className="text-sm text-text/50">Ask me anything about your studies.</p>
            <p className="text-xs text-text/30">
              I can check your assignments, grades, exams, and flashcards — or create
              them for you.
            </p>
          </div>
        )}

        {displayMessages.map((m, i) => (
          <div key={i}>
            {/* Tool action indicators (shown before assistant reply) */}
            {m.role === 'assistant' && m.actions?.length > 0 && (
              <div className="mb-1">
                {m.actions.map((a, j) => (
                  <ToolBadge key={j} tool={a.tool} />
                ))}
              </div>
            )}

            <div className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div
                className={cn(
                  'max-w-[78%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'bg-primary text-background'
                    : 'bg-white/10 text-text'
                )}
              >
                {m.content}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white/10 rounded-2xl px-4 py-3 flex gap-1">
              <span className="w-2 h-2 rounded-full bg-text/50 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 rounded-full bg-text/50 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 rounded-full bg-text/50 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-white/10 p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your homework, grades, upcoming exams…"
          className="flex-1 px-4 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
