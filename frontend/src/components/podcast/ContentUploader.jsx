import { useState } from 'react'
import { Upload } from 'lucide-react'

export default function ContentUploader({ onChange }) {
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')

  const handleTextChange = (e) => {
    setText(e.target.value)
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
      // PDF / other formats: text extraction happens server-side in a future
      // iteration. For now we just note the filename so the user has feedback.
      const placeholder = `[Attached file: ${file.name}. Text extraction for this file type will happen server-side.]`
      setText(placeholder)
      onChange(placeholder)
    }
  }

  return (
    <div className="space-y-3">
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
    </div>
  )
}
