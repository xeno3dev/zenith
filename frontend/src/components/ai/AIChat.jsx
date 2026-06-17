import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import api from '../../lib/api'
import { cn } from '../../lib/utils'

export default function AIChat() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const newMessages = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await api.post('/ai/chat', {
        messages: newMessages,
        context: 'Scholara study assistant',
      })
      setMessages((prev) => [...prev, { role: 'assistant', content: res.data.reply }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble responding. Please try again.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-surface rounded-xl flex flex-col h-[60vh]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-text/50 text-center mt-8">
            Ask me anything about your studies.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap',
                m.role === 'user' ? 'bg-primary text-white' : 'bg-white/10 text-text'
              )}
            >
              {m.content}
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
          placeholder="Type your question..."
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
