import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import api from '../../lib/api'
import { cn } from '../../lib/utils'

export default function QuizMode() {
  const [decks, setDecks] = useState([])
  const [deckId, setDeckId] = useState('')
  const [loading, setLoading] = useState(false)
  const [questions, setQuestions] = useState([])
  const [current, setCurrent] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState('')
  const [textAnswer, setTextAnswer] = useState('')
  const [feedback, setFeedback] = useState(null)

  useEffect(() => {
    api
      .get('/decks')
      .then((res) => setDecks(res.data || []))
      .catch(() => setDecks([]))
  }, [])

  const handleStart = async () => {
    if (!deckId) return
    setLoading(true)
    try {
      const res = await api.post('/ai/quiz', { deck_id: deckId })
      setQuestions(res.data.questions || [])
      setCurrent(0)
      setScore(0)
      setSelected('')
      setTextAnswer('')
      setFeedback(null)
    } catch {
      toast.error('Could not generate quiz for this deck')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setQuestions([])
    setCurrent(0)
    setScore(0)
    setSelected('')
    setTextAnswer('')
    setFeedback(null)
    setDeckId('')
  }

  const question = questions[current]

  const handleSubmitAnswer = () => {
    if (!question) return
    const given = question.type === 'mcq' ? selected : textAnswer
    const isCorrect =
      given.trim().toLowerCase() === String(question.answer).trim().toLowerCase()
    if (isCorrect) setScore((s) => s + 1)
    setFeedback(isCorrect ? 'correct' : 'incorrect')
  }

  const handleNext = () => {
    setSelected('')
    setTextAnswer('')
    setFeedback(null)
    setCurrent((c) => c + 1)
  }

  if (questions.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-6 space-y-4">
        <h3 className="font-semibold">Quiz yourself on a deck</h3>
        <select
          value={deckId}
          onChange={(e) => setDeckId(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a deck</option>
          {decks.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleStart}
          disabled={!deckId || loading}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {loading ? 'Generating quiz...' : 'Start Quiz'}
        </button>
      </div>
    )
  }

  if (current >= questions.length) {
    return (
      <div className="bg-surface rounded-xl p-10 text-center space-y-4">
        <h3 className="text-xl font-bold text-primary">Quiz complete!</h3>
        <p className="text-text/70">
          You scored {score}/{questions.length}
        </p>
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          Try Another Deck
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl p-6 space-y-5">
      <p className="text-xs text-text/50">
        Question {current + 1} of {questions.length} &middot; Score: {score}
      </p>
      <p className="font-medium">{question.question}</p>

      {question.type === 'mcq' ? (
        <div className="space-y-2">
          {(question.options || []).map((opt) => (
            <button
              key={opt}
              onClick={() => setSelected(opt)}
              disabled={feedback !== null}
              className={cn(
                'w-full text-left px-4 py-2 rounded-lg text-sm border transition-colors',
                selected === opt
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-white/10 hover:bg-white/5'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          disabled={feedback !== null}
          placeholder="Type your answer"
          className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      )}

      {feedback && (
        <p className={cn('text-sm font-medium', feedback === 'correct' ? 'text-green-400' : 'text-accent')}>
          {feedback === 'correct' ? 'Correct!' : `Incorrect. Answer: ${question.answer}`}
        </p>
      )}

      <div className="flex gap-2">
        {feedback === null ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={question.type === 'mcq' ? !selected : !textAnswer.trim()}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Submit Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
          >
            Next
          </button>
        )}
      </div>
    </div>
  )
}
