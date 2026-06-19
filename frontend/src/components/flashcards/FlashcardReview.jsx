import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '../../lib/api'

const RATINGS = [
  { label: 'Again', quality: 0, color: 'bg-red-500/20 text-red-400 hover:bg-red-500/30' },
  { label: 'Hard', quality: 3, color: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' },
  { label: 'Good', quality: 4, color: 'bg-primary/20 text-primary hover:bg-primary/30' },
  { label: 'Easy', quality: 5, color: 'bg-green-500/20 text-green-400 hover:bg-green-500/30' },
]

export default function FlashcardReview({ deckId }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewedCount, setReviewedCount] = useState(0)

  useEffect(() => {
    api
      .get('/cards/due', { params: { deck_id: deckId } })
      .then((res) => setCards(res.data || []))
      .catch(() => setCards([]))
      .finally(() => setLoading(false))
  }, [deckId])

  const handleReview = (quality) => {
    const card = cards[index]
    if (!card) return
    api
      .post(`/cards/${card.id}/review`, { quality })
      .catch(() => toast.error('Could not save review'))
    setFlipped(false)
    setReviewedCount((c) => c + 1)
    setIndex((i) => i + 1)
  }

  if (loading) {
    return <p className="text-sm text-text/50">Loading cards...</p>
  }

  if (cards.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-8 text-center text-text/60">
        No cards due in this deck right now. Great job!
      </div>
    )
  }

  if (index >= cards.length) {
    return (
      <div className="bg-surface rounded-xl p-10 text-center space-y-2">
        <h3 className="text-xl font-bold text-primary">All done!</h3>
        <p className="text-text/60">You reviewed {reviewedCount} card{reviewedCount === 1 ? '' : 's'}.</p>
      </div>
    )
  }

  const card = cards[index]
  const progress = Math.round((index / cards.length) * 100)

  return (
    <div className="space-y-4">
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-text/50 text-center">
        {index} / {cards.length}
      </p>

      {/* Card flip — proper CSS 3D: parent rotates, faces pre-positioned with backface-visibility hidden */}
      <div
        onClick={() => setFlipped((f) => !f)}
        className="cursor-pointer select-none"
        style={{ perspective: '1000px' }}
      >
        <div
          className="relative rounded-2xl transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            minHeight: '220px',
          }}
        >
          {/* Front face */}
          <div
            className="absolute inset-0 bg-surface rounded-2xl flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-lg font-medium">{card.front}</p>
            <p className="text-xs text-text/40 mt-3">Tap to flip</p>
          </div>

          {/* Back face — pre-rotated 180° so it faces away initially and comes forward on flip */}
          <div
            className="absolute inset-0 bg-surface rounded-2xl flex flex-col items-center justify-center p-8 text-center"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-lg font-medium text-accent">{card.back}</p>
            <p className="text-xs text-text/40 mt-3">Tap to flip back</p>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {RATINGS.map((r) => (
            <button
              key={r.label}
              onClick={() => handleReview(r.quality)}
              className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${r.color}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
