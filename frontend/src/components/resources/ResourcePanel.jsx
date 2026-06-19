import { useEffect, useRef, useState } from 'react'
import { Paperclip, Upload, Trash2, FileText, Image, File, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import api from '../../lib/api'

function fileIcon(mimeType) {
  if (mimeType?.startsWith('image/')) return Image
  if (mimeType === 'application/pdf' || mimeType?.includes('word')) return FileText
  return File
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ResourcePanel({ entityType, entityId }) {
  const [resources, setResources] = useState([])
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    api
      .get('/resources', { params: { entity_type: entityType, entity_id: entityId } })
      .then((res) => setResources(res.data || []))
      .catch(() => {})
  }, [entityType, entityId])

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    form.append('entity_type', entityType)
    form.append('entity_id', String(entityId))
    setUploading(true)
    try {
      const res = await api.post('/resources', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResources((prev) => [res.data, ...prev])
      toast.success('File uploaded')
    } catch (err) {
      const msg = err?.response?.data?.error || 'Upload failed'
      toast.error(msg)
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

  return (
    <div className="mt-3 border-t border-white/10 pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-text/60 flex items-center gap-1.5">
          <Paperclip size={12} />
          Files ({resources.length})
        </span>
        <label className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
          uploading
            ? 'bg-white/5 text-text/30 pointer-events-none'
            : 'bg-white/5 hover:bg-white/10 text-text/70'
        }`}>
          <Upload size={12} />
          {uploading ? 'Uploading…' : 'Upload'}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {resources.length === 0 ? (
        <p className="text-xs text-text/40 py-1">No files attached.</p>
      ) : (
        <ul className="space-y-1">
          {resources.map((r) => {
            const Icon = fileIcon(r.mime_type)
            return (
              <li key={r.id} className="flex items-center gap-2 group">
                <Icon size={14} className="text-text/50 shrink-0" />
                <span className="text-xs text-text/80 flex-1 truncate">{r.original_name}</span>
                {r.has_text && (
                  <CheckCircle size={12} className="text-green-400 shrink-0" title="Text extracted" />
                )}
                <span className="text-xs text-text/40 shrink-0">{formatBytes(r.file_size)}</span>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="shrink-0 text-text/30 hover:text-accent opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
