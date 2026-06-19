import { useState } from 'react'
import { toast } from 'sonner'
import { Upload } from 'lucide-react'
import api from '../../lib/api'

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase())
  const frontIdx = header.indexOf('front')
  const backIdx = header.indexOf('back')
  if (frontIdx === -1 || backIdx === -1) return []

  return lines.slice(1).map((line) => {
    const cols = line.split(',')
    return {
      front: (cols[frontIdx] || '').trim(),
      back: (cols[backIdx] || '').trim(),
    }
  })
}

export default function FlashcardImport({ deckId, onImported }) {
  const [rows, setRows] = useState([])
  const [importing, setImporting] = useState(false)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result || ''))
      setRows(parsed)
    }
    reader.readAsText(file)
  }

  const handleConfirm = async () => {
    if (rows.length === 0) return
    setImporting(true)
    // Note: backend has no true batch-create endpoint per spec, so we POST sequentially.
    let successCount = 0
    for (const row of rows) {
      if (!row.front || !row.back) continue
      try {
        await api.post(`/decks/${deckId}/cards`, row)
        successCount += 1
      } catch {
        // skip failed row, continue importing the rest
      }
    }
    setImporting(false)
    toast.success(`Imported ${successCount} card${successCount === 1 ? '' : 's'}`)
    setRows([])
    if (onImported) onImported()
  }

  return (
    <div className="bg-surface rounded-xl p-4 space-y-3">
      <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-white/20 cursor-pointer text-sm text-text/70 hover:border-primary">
        <Upload size={16} />
        <span>Choose a CSV file (columns: front,back)</span>
        <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
      </label>

      {rows.length > 0 && (
        <>
          <div className="overflow-x-auto max-h-60 overflow-y-auto rounded-lg border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-background/50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Front</th>
                  <th className="text-left px-3 py-2">Back</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-3 py-2">{row.front}</td>
                    <td className="px-3 py-2">{row.back}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleConfirm}
            disabled={importing}
            className="px-4 py-2 rounded-lg bg-primary text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {importing ? 'Importing...' : `Import ${rows.length} cards`}
          </button>
        </>
      )}
    </div>
  )
}
