import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import api from '../lib/api'
import useFlashcards from '../hooks/useFlashcards'
import useSubjects from '../hooks/useSubjects'
import FlashcardDeck from '../components/flashcards/FlashcardDeck'
import FlashcardReview from '../components/flashcards/FlashcardReview'
import FlashcardImport from '../components/flashcards/FlashcardImport'

export default function Flashcards() {
  const { decks, loading, fetchDecks } = useFlashcards()
  const { subjects } = useSubjects()
  const [view, setView] = useState('decks')
  const [selectedDeck, setSelectedDeck] = useState(null)
  const [dueCounts, setDueCounts] = useState({})
  const [showNewDeck, setShowNewDeck] = useState(false)
  const [showImportFor, setShowImportFor] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', subject_id: '' })

  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  const loadDueCounts = useCallback(() => {
    api
      .get('/cards/due')
      .then((res) => {
        const counts = {}
        ;(res.data || []).forEach((card) => {
          counts[card.deck_id] = (counts[card.deck_id] || 0) + 1
        })
        setDueCounts(counts)
      })
      .catch(() => setDueCounts({}))
  }, [])

  useEffect(() => {
    loadDueCounts()
  }, [decks, loadDueCounts])

  const handleEnterReview = (deck) => {
    setSelectedDeck(deck)
    setView('review')
  }

  const handleBack = () => {
    setView('decks')
    setSelectedDeck(null)
    fetchDecks()
    loadDueCounts()
  }

  const handleCreateDeck = (e) => {
    e.preventDefault()
    api
      .post('/decks', { ...form, subject_id: form.subject_id || null })
      .then(() => {
        toast.success('Deck created')
        setShowNewDeck(false)
        setForm({ name: '', description: '', subject_id: '' })
        fetchDecks()
      })
      .catch(() => toast.error('Could not create deck'))
  }

  if (view === 'review' && selectedDeck) {
    return (
      <div className="space-y-4">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-text/70 hover:text-text"
        >
          <ArrowLeft size={16} />
          Back to decks
        </button>
        <h1 className="text-2xl font-bold">{selectedDeck.name}</h1>
        <FlashcardReview deckId={selectedDeck.id} />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Flashcards</h1>
          <p className="text-text/60 mt-1">Spaced repetition decks for active recall.</p>
        </div>
        <button
          onClick={() => setShowNewDeck((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-background text-sm font-medium hover:opacity-90"
        >
          <Plus size={16} />
          New Deck
        </button>
      </div>

      {showNewDeck && (
        <form onSubmit={handleCreateDeck} className="bg-surface rounded-xl p-4 space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <input
              type="text"
              required
              placeholder="Deck name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={form.subject_id}
              onChange={(e) => setForm((p) => ({ ...p, subject_id: e.target.value }))}
              className="px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">No subject</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            rows={2}
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-accent text-background text-sm font-medium hover:opacity-90"
          >
            Create Deck
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-text/50">Loading decks...</p>
      ) : decks.length === 0 ? (
        <div className="bg-surface rounded-xl p-8 text-center text-text/50 text-sm">
          No decks yet. Create one to get started.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <div key={deck.id} className="space-y-2">
              <FlashcardDeck
                deck={deck}
                dueCount={dueCounts[deck.id] || 0}
                onClick={() => handleEnterReview(deck)}
              />
              <button
                onClick={() => setShowImportFor(showImportFor === deck.id ? null : deck.id)}
                className="text-xs text-primary hover:underline"
              >
                {showImportFor === deck.id ? 'Hide import' : 'Import CSV'}
              </button>
              {showImportFor === deck.id && (
                <FlashcardImport
                  deckId={deck.id}
                  onImported={() => {
                    fetchDecks()
                    loadDueCounts()
                    setShowImportFor(null)
                  }}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
