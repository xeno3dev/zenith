import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'
import { cn } from '../lib/utils'
import AIChat from '../components/ai/AIChat'

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now - d) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' })
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function AIAssistant() {
  const [sessions, setSessions] = useState([])
  const [activeSession, setActiveSession] = useState(null)  // { id, title, messages }
  const [loadingSession, setLoadingSession] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // ── Fetch session list ────────────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      const res = await api.get('/ai/sessions')
      setSessions(res.data || [])
    } catch {
      // silent — sessions are a convenience feature
    }
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  // ── Create new session ────────────────────────────────────────────────────
  const handleNewChat = async () => {
    try {
      const res = await api.post('/ai/sessions')
      const session = { ...res.data, messages: [] }
      setSessions((prev) => [res.data, ...prev])
      setActiveSession(session)
    } catch {
      toast.error('Could not create new chat')
    }
  }

  // ── Load a session ────────────────────────────────────────────────────────
  const handleSelectSession = async (sessionMeta) => {
    if (activeSession?.id === sessionMeta.id) return
    setLoadingSession(true)
    try {
      const res = await api.get(`/ai/sessions/${sessionMeta.id}`)
      setActiveSession(res.data)
    } catch {
      toast.error('Could not load chat')
    } finally {
      setLoadingSession(false)
    }
  }

  // ── Delete a session ──────────────────────────────────────────────────────
  const handleDelete = async (e, sessionId) => {
    e.stopPropagation()
    try {
      await api.delete(`/ai/sessions/${sessionId}`)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      if (activeSession?.id === sessionId) setActiveSession(null)
      toast.success('Chat deleted')
    } catch {
      toast.error('Could not delete chat')
    }
  }

  // ── Called by AIChat when a new session is auto-created or title updates ──
  const handleSessionCreated = useCallback((sessionMeta) => {
    setSessions((prev) => {
      const exists = prev.find((s) => s.id === sessionMeta.id)
      if (exists) {
        return prev.map((s) =>
          s.id === sessionMeta.id ? { ...s, ...sessionMeta } : s
        )
      }
      return [sessionMeta, ...prev]
    })
    setActiveSession((prev) =>
      prev?.id === sessionMeta.id ? { ...prev, ...sessionMeta } : prev
    )
  }, [])

  return (
    <div className="flex gap-0 h-[calc(100vh-100px)] -m-4 md:-m-6">
      {/* ── Sessions sidebar ─────────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col border-r border-white/10 bg-surface/50 transition-all duration-200 shrink-0',
          sidebarOpen ? 'w-64' : 'w-12'
        )}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          {sidebarOpen && (
            <span className="text-xs font-semibold text-text/50 uppercase tracking-wider">
              Chats
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-text/40 hover:text-text transition-colors ml-auto"
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>

        {sidebarOpen && (
          <>
            {/* New chat button */}
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 mx-3 mt-3 mb-1 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <Plus size={14} />
              New chat
            </button>

            {/* Session list */}
            <div className="flex-1 overflow-y-auto py-1">
              {sessions.length === 0 ? (
                <p className="text-xs text-text/30 px-4 py-3">
                  No chats yet. Start a new one!
                </p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleSelectSession(s)}
                    className={cn(
                      'w-full text-left px-3 py-2.5 flex items-start gap-2 group transition-colors',
                      activeSession?.id === s.id
                        ? 'bg-primary/10 text-primary'
                        : 'text-text/70 hover:bg-white/5 hover:text-text'
                    )}
                  >
                    <MessageSquare size={14} className="shrink-0 mt-0.5 opacity-60" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.title}</p>
                      <p className="text-[10px] text-text/40 mt-0.5">
                        {formatDate(s.updated_at)} · {s.message_count} msg
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, s.id)}
                      className="shrink-0 text-text/20 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity mt-0.5"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Main chat area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 p-4 md:p-6">
        {activeSession ? (
          <>
            <div className="mb-3">
              <h1 className="text-lg font-bold truncate">{activeSession.title}</h1>
              <p className="text-text/50 text-xs mt-0.5">
                Ask about your assignments, grades, exams, files — or paste an image.
              </p>
            </div>
            {loadingSession ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                </div>
              </div>
            ) : (
              <AIChat
                key={activeSession.id}
                sessionId={activeSession.id}
                initialMessages={activeSession.messages || []}
                onSessionCreated={handleSessionCreated}
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <MessageSquare className="text-primary" size={32} />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">AI Study Assistant</h2>
              <p className="text-text/50 text-sm max-w-sm">
                Ask about your assignments, grades, upcoming exams, or paste an image
                of notes or problems. Each conversation is saved automatically.
              </p>
            </div>
            <button
              onClick={handleNewChat}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Plus size={16} />
              Start a new chat
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
