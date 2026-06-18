import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function SubjectPicker({ subjects, onSelect, onClose }) {
  const navigate = useNavigate()
  
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-surface rounded-xl p-4 w-full max-w-sm max-h-[70vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Choose a subject</h3>
          <button onClick={onClose} className="text-text/50 hover:text-text">
            <X size={18} />
          </button>
        </div>

        <ul className="space-y-1">
          {subjects.length === 0 && (
            <li className="py-2">
              <button
                onClick={() => { onClose(); navigate('/subjects') }}
                className="text-sm text-accent hover:underline"
              >
                No subjects yet — add one
              </button>
            </li>
          )}
          {subjects.map((subject) => (
            <li key={subject.id}>
              <button
                onClick={() => onSelect(subject)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 text-left text-sm"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: subject.color }}
                />
                <span className="truncate">{subject.name}</span>
              </button>
            </li>
          ))}
        </ul>

        <button
          onClick={() => onSelect(null)}
          className="w-full mt-2 px-3 py-2 rounded-lg text-sm text-accent hover:bg-accent/10 text-left"
        >
          Clear cell
        </button>
      </div>
    </div>
  )
}
