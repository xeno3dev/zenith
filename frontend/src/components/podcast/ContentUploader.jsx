import { useEffect, useState } from 'react'
import { Upload, FolderOpen, FileText, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import { cn } from '../../lib/utils'

const MODES = ['text', 'library']

export default function ContentUploader({ onChange }) {
  const [mode, setMode] = useState('text')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [resources, setResources] = useState([])
  const [loadingRes, setLoadingRes] = useState(false)
  const [selectedRes, setSelectedRes] = useState(null)

  // Load library resources when switching to library tab
  useEffect(() => {
    if (mode === 'library' && resources.length === 0) {
      setLoadingRes(true)
      api
        .get('/resources', { params: { entity_type: 'general' } })
        .then((res) => setResources(res.data?.filter((r) => r.has_text) || []))
        .catch(() => {})
        .finally(() => setLoadingRes(false))
    }
  }, [mode]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTextChange = (e) => {
    setText(e.target.value)
    setSelectedRes(null)
    onChange(e.target.value)
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)

    if (file.name.toLowerCase().endsWith('.txt')) {
      const reader = new FileReader()
      reader.onload = () => {
        const content = String(reader.result || '')
        setText(content)
        onChange(content)
      }
      reader.readAsText(file)
    } else {
      const placeholder = `[Attached file: ${file.name}]`
      setText(placeholder)
      onChange(placeholder)
    }
  }

  const handleSelectResource = async (r) => {
    setSelectedRes(r)
    try {
      const res = await api.get(`/resources/${r.id}`)
      const content = res.data.extracted_text || ''
      onChange(content)
    } catch {
      onChange('')
    }
  }

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-background rounded-lg w-fit">
        <button
          onClick={() => setMode('text')}
          className={cn(
            'px-3 py-1.5 rounded text-xs font-medium transition-colors',
            mode === 'text' ? 'bg-surface text-text' : 'text-text/50 hover:text-text'
          )}
        >
          Type / Paste
        </button>
        <button
          onClick={() => setMode('library')}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
            mode === 'library' ? 'bg-surface text-text' : 'text-text/50 hover:text-text'
          )}
        >
          <FolderOpen size={12} />
          From Library
        </button>
      </div>

      {mode === 'text' ? (
        <>
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Paste your notes here..."
            rows={8}
            className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/20 cursor-pointer text-sm text-text/70 hover:border-primary">
            <Upload size={16} />
            <span>{fileName ? `Selected: ${fileName}` : 'Or upload a .txt file'}</span>
            <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFile} className="hidden" />
          </label>
        </>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-text/50">
            Files from your{' '}
            <a href="/resources" className="text-primary underline" target="_blank" rel="noreferrer">
              Resource Library
            </a>{' '}
            with extracted text:
          </p>
          {loadingRes ? (
            <p className="text-xs text-text/40">Loading library…</p>
          ) : resources.length === 0 ? (
            <p className="text-xs text-text/40">
              No library files with readable text yet.{' '}
              <a href="/resources" className="text-primary underline">
                Upload PDFs, Word docs, or text files
              </a>{' '}
              to your library first.
            </p>
          ) : (
            <ul className="space-y-1 max-h-56 overflow-y-auto">
              {resources.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => handleSelectResource(r)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-colors',
                      selectedRes?.id === r.id
                        ? 'bg-primary/10 text-primary'
                        : 'bg-background hover:bg-white/5 text-text'
                    )}
                  >
                    <FileText size={14} className="shrink-0 text-text/50" />
                    <span className="flex-1 truncate">{r.original_name}</span>
                    {selectedRes?.id === r.id && (
                      <CheckCircle size={14} className="shrink-0 text-primary" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {selectedRes && (
            <p className="text-xs text-primary/70">
              ✓ Using <span className="font-medium">{selectedRes.original_name}</span> as source
            </p>
          )}
        </div>
      )}
    </div>
  )
}
