import { useEffect, useRef, useState, useCallback } from 'react'
import { Send, Zap, Paperclip, X, Image as ImageIcon } from 'lucide-react'
import api from '../../lib/api'
import { cn } from '../../lib/utils'

const TOOL_LABELS = {
  get_assignments: 'Checking your assignments…',
  get_upcoming_exams: 'Looking up upcoming exams…',
  get_grades_summary: 'Fetching your grades…',
  get_due_flashcards: 'Checking flashcard review queue…',
  list_decks: 'Listing your flashcard decks…',
  create_assignment: 'Creating assignment…',
  add_flashcard: 'Adding flashcard…',
  get_study_time: 'Checking study time…',
  list_resources: 'Looking up resources…',
  list_all_resources: 'Looking up your files…',
  read_resource: 'Reading your file…',
  generate_flashcards_from_resource: 'Generating flashcards from file…',
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

/** Convert a File/Blob to a base64 data string */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      // result is "data:<mime>;base64,<data>" — extract just the data part
      const result = reader.result
      const base64 = result.split(',')[1]
      resolve({ base64, mediaType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Render a single message bubble (handles text + image content) */
function MessageBubble({ m }) {
  const isUser = m.role === 'user'
  const content = m.content

  // Normalise: if content is a string, treat as a single text block
  const blocks = Array.isArray(content)
    ? content
    : [{ type: 'text', text: content }]

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[78%] rounded-2xl px-4 py-2 text-sm space-y-2',
          isUser ? 'bg-primary text-background' : 'bg-white/10 text-text'
        )}
      >
        {blocks.map((block, i) => {
          if (block.type === 'text') {
            return (
              <p key={i} className="whitespace-pre-wrap leading-relaxed">
                {block.text}
              </p>
            )
          }
          if (block.type === 'image') {
            const src =
              block.source?.type === 'base64'
                ? `data:${block.source.media_type};base64,${block.source.data}`
                : null
            if (!src) return null
            return (
              <img
                key={i}
                src={src}
                alt="Attached image"
                className="max-w-full max-h-64 rounded-lg object-contain"
              />
            )
          }
          return null
        })}
      </div>
    </div>
  )
}

export default function AIChat({ sessionId, initialMessages = [], onSessionCreated }) {
  const [messages, setMessages] = useState(initialMessages)
  const [input, setInput] = useState('')
  const [pendingImages, setPendingImages] = useState([]) // [{base64, mediaType, preview}]
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const activeSessionId = useRef(sessionId)

  // Sync session changes from parent
  useEffect(() => {
    setMessages(initialMessages)
    activeSessionId.current = sessionId
    setPendingImages([])
    setInput('')
  }, [sessionId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ── Image helpers ─────────────────────────────────────────────────────────

  const addImageFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large — max 5 MB')
      return
    }
    try {
      const { base64, mediaType } = await fileToBase64(file)
      const preview = URL.createObjectURL(file)
      setPendingImages((prev) => [...prev, { base64, mediaType, preview }])
    } catch {
      setError('Could not read image')
    }
  }, [])

  const handlePaste = useCallback(
    (e) => {
      const items = e.clipboardData?.items ?? []
      for (const item of items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          e.preventDefault()
          addImageFile(item.getAsFile())
        }
      }
    },
    [addImageFile]
  )

  const handleFileInput = useCallback(
    (e) => {
      const files = Array.from(e.target.files || [])
      files.forEach(addImageFile)
      e.target.value = ''
    },
    [addImageFile]
  )

  const removeImage = (idx) => {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = async (e) => {
    e.preventDefault()
    const text = input.trim()
    if ((!text && pendingImages.length === 0) || loading) return

    // Build the content — array if images present, else plain string
    let userContent
    if (pendingImages.length > 0) {
      const blocks = []
      if (text) blocks.push({ type: 'text', text })
      for (const img of pendingImages) {
        blocks.push({
          type: 'image',
          source: { type: 'base64', media_type: img.mediaType, data: img.base64 },
        })
      }
      userContent = blocks
    } else {
      userContent = text
    }

    const userMsg = { role: 'user', content: userContent }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setPendingImages([])
    setLoading(true)

    try {
      let res
      if (activeSessionId.current) {
        res = await api.post('/ai/chat', {
          session_id: activeSessionId.current,
          message: userContent,
        })
      } else {
        // No session yet — create one first
        const sessionRes = await api.post('/ai/sessions')
        const newSession = sessionRes.data
        activeSessionId.current = newSession.id
        if (onSessionCreated) onSessionCreated(newSession)

        res = await api.post('/ai/chat', {
          session_id: newSession.id,
          message: userContent,
        })
      }

      const { reply, actions = [], session_title } = res.data
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, actions },
      ])

      // Propagate updated title to parent
      if (session_title && onSessionCreated) {
        onSessionCreated({ id: activeSessionId.current, title: session_title })
      }
    } catch (err) {
      const msg = err?.response?.data?.error || 'Something went wrong — please try again.'
      // Show the error as an assistant message so it appears inline in the chat
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: msg, actions: [] },
      ])
    } finally {
      setLoading(false)
    }
  }

  const canSend = (input.trim() || pendingImages.length > 0) && !loading

  return (
    <div className="bg-surface rounded-xl flex flex-col h-[calc(100vh-220px)] min-h-[400px]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center mt-10 space-y-2">
            <p className="text-sm text-text/50">Ask me anything about your studies.</p>
            <p className="text-xs text-text/30">
              I can check your assignments, grades, exams, flashcards, and uploaded files —
              or create them for you. You can also paste images directly into the chat.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            {m.role === 'assistant' && m.actions?.length > 0 && (
              <div className="mb-1">
                {m.actions.map((a, j) => (
                  <ToolBadge key={j} tool={a.tool} />
                ))}
              </div>
            )}
            <MessageBubble m={m} />
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

      {/* Pending image previews */}
      {pendingImages.length > 0 && (
        <div className="flex gap-2 px-3 py-2 border-t border-white/10 overflow-x-auto">
          {pendingImages.map((img, idx) => (
            <div key={idx} className="relative shrink-0">
              <img
                src={img.preview}
                alt="pending"
                className="h-16 w-16 object-cover rounded-lg border border-white/20"
              />
              <button
                onClick={() => removeImage(idx)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-background border border-white/20 flex items-center justify-center text-text/60 hover:text-accent"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSend} className="border-t border-white/10 p-3 flex gap-2">
        {/* Image upload button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 p-2 rounded-lg text-text/40 hover:text-text hover:bg-white/5 transition-colors"
          title="Attach image (or paste with Ctrl+V)"
        >
          <ImageIcon size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileInput}
        />

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onPaste={handlePaste}
          placeholder={
            pendingImages.length > 0
              ? 'Add a caption… (or send image only)'
              : 'Ask about your homework, grades, exams… or paste an image'
          }
          className="flex-1 px-4 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-40 flex items-center justify-center transition-opacity"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}
