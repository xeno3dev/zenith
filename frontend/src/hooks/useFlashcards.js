import { useState, useCallback } from 'react'
import api from '../lib/api'

export default function useFlashcards() {
  const [decks, setDecks] = useState([])
  const [loading, setLoading] = useState(false)
  const [dueCards, setDueCards] = useState([])

  const fetchDecks = useCallback(() => {
    setLoading(true)
    return api
      .get('/decks')
      .then((res) => setDecks(res.data || []))
      .catch(() => setDecks([]))
      .finally(() => setLoading(false))
  }, [])

  const fetchDueCards = useCallback((deckId) => {
    const params = deckId ? { deck_id: deckId } : {}
    return api
      .get('/cards/due', { params })
      .then((res) => {
        setDueCards(res.data || [])
        return res.data
      })
      .catch(() => {
        setDueCards([])
        return []
      })
  }, [])

  const submitReview = useCallback((cardId, quality) => {
    return api.post(`/cards/${cardId}/review`, { quality })
  }, [])

  return { decks, loading, fetchDecks, dueCards, fetchDueCards, submitReview }
}
