import { useEffect, useRef, useState } from 'react'
import {
  Upload,
  Trash2,
  FileText,
  Image,
  File,
  CheckCircle,
  Search,
  FolderOpen,
  Download,
} from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'
import { cn } from '../lib/utils'

const TABS = [
  { key: 'all', label: 'All Files' },
  { key: 'general', label: 'Library (AI & Podcasts)' },
  { key: 'subject', label: 'Subjects' },
  { key: 'assignment', label: 'Assignments' },
  { key: 'exam', label: 'Exams' },
]

function fileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return Image
  if (mimeType === 'application/pdf' || mimeType?.includes('word')) return FileText
  return File
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function entityLabel(r) {
  if (r.entity_type === 'general') return 'Library'
  return `${r.entity_type.charAt(0).toUpperCase() + r.entity_type.slice(1)} #${r.entity_id}`
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Resources() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const fetchResources = async () => {
    setLoading(true)
    try {
      const res = await api.get('/resources')
      setResources(res.data || [])
    } catch {
      toast.error('Could not load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResources()
  }, [])

  const filtered = resources.filter((r) => {
    const matchTab = tab === 'all' || r.entity_type === tab
    const matchSearch = !search || r.original_name.toLowerCase().includes(search.toLowerCase())
    return matchTab && matchSearch
  })

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    form.append('entity_type', 'general')
    // entity_id not needed for general — backend defaults to 0
    setUploading(true)
    try {
      const res = await api.post('/resources', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResources((prev) => [res.data, ...prev])
      toast.success('File added to your library')
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/resources/${id}`)
      setResources((prev) => prev.filter((r) => r.id !== id))
      toast.success('File deleted')
    } catch {
      toast.error('Could not delete file')
    }
  }

  const handleDownload = (r) => {
    // Open the file-serve endpoint in a new tab
    const token = localStorage.getItem('access_token')
    window.open(`/api/resources/${r.id}/file?token=${token}`, '_blank')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Resources</h1>
          <p className="text-text/60 mt-1">
            Upload files here to use them site-wide with the AI Assistant and Podcasts.
          </p>
        </div>
        <label
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors',
            uploading
              ? 'bg-white/5 text-text/30 pointer-events-none'
              : 'bg-primary text-background hover:opacity-90'
          )}
        >
          <Upload size={16} />
          {uploading ? 'Uploading…' : 'Upload to Library'}
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Library callout */}
      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3">
        <FolderOpen className="text-primary shrink-0 mt-0.5" size={18} />
        <div className="text-sm">
          <span className="font-semibold text-primary">Library files</span>
          <span className="text-text/60">
            {' '}are available to the AI Assistant and Podcast generator. The AI can read them
            and reference them in your conversations. You can also attach files directly to
            subjects, assignments, and exams from those pages.
          </span>
        </div>
      </div>

      {/* Search + Tabs */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-surface border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              tab === key
                ? 'bg-primary text-background'
                : 'bg-surface text-text/60 hover:text-text hover:bg-white/5'
            )}
          >
            {label}
            <span className="ml-1.5 opacity-60">
              ({resources.filter((r) => key === 'all' || r.entity_type === key).length})
            </span>
          </button>
        ))}
      </div>

      {/* File list */}
      {loading ? (
        <p className="text-sm text-text/50">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="bg-surface rounded-xl p-10 text-center space-y-2">
          <FolderOpen className="mx-auto text-text/30" size={32} />
          <p className="text-sm text-text/50">
            {search ? 'No files match your search.' : 'No files here yet.'}
          </p>
          {tab === 'general' && !search && (
            <p className="text-xs text-text/30">
              Upload files above to make them available to the AI and Podcast generator.
            </p>
          )}
        </div>
      ) : (
        <div className="bg-surface rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-text/40 text-xs">
                <th className="text-left px-4 py-3 font-medium">File</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Source</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Size</th>
                <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.map((r) => {
                const Icon = fileIcon(r.mime_type)
                return (
                  <tr key={r.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Icon size={16} className="text-text/50 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium truncate max-w-[200px]">{r.original_name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {r.has_text && (
                              <span className="flex items-center gap-1 text-[10px] text-green-400">
                                <CheckCircle size={10} /> Text extracted
                              </span>
                            )}
                            {r.anthropic_file_id && (
                              <span className="text-[10px] text-primary/60">AI ready</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          r.entity_type === 'general'
                            ? 'bg-primary/10 text-primary'
                            : 'bg-white/5 text-text/50'
                        )}
                      >
                        {entityLabel(r)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-text/50 hidden md:table-cell text-xs">
                      {formatBytes(r.file_size)}
                    </td>
                    <td className="px-4 py-3 text-text/40 hidden md:table-cell text-xs">
                      {formatDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleDownload(r)}
                          className="p-1.5 rounded text-text/40 hover:text-text hover:bg-white/10"
                          title="Download"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="p-1.5 rounded text-text/40 hover:text-accent hover:bg-accent/10"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
