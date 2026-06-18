import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../lib/api'
import ContentUploader from './ContentUploader'

const LOADING_MESSAGES = [
  'Ari and Sol are preparing your episode...',
  'Ari is reading through your notes...',
  'Sol is writing some jokes for the intro...',
  'Mixing the audio and adding some flair...',
  'Almost there, just polishing the script...',
]

export default function PodcastGenerator({ onReady }) {
  const [step, setStep] = useState(1)
  const [sourceContent, setSourceContent] = useState('')
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [podcastId, setPodcastId] = useState(null)
  const [status, setStatus] = useState(null)
  const [error, setError] = useState(null)
  const [messageIndex, setMessageIndex] = useState(0)
  const pollRef = useRef(null)
  const messageRef = useRef(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
      if (messageRef.current) clearInterval(messageRef.current)
    }
  }, [])

  const startPolling = (id) => {
    messageRef.current = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 2500)

    pollRef.current = setInterval(() => {
      api
        .get(`/podcasts/${id}`)
        .then((res) => {
          const podcast = res.data
          setStatus(podcast.status)
          if (podcast.status === 'ready') {
            clearInterval(pollRef.current)
            clearInterval(messageRef.current)
            toast.success('Episode ready!')
            if (onReady) onReady(podcast)
          } else if (podcast.status === 'failed') {
            clearInterval(pollRef.current)
            clearInterval(messageRef.current)
            setError('Generation failed. Please try again.')
          }
        })
        .catch(() => {
          clearInterval(pollRef.current)
          clearInterval(messageRef.current)
          setError('Something went wrong while checking episode status.')
        })
    }, 3000)
  }

  const handleGenerate = () => {
    setError(null)
    setStep(4)
    setStatus('processing')
    api
      .post('/podcasts', {
        title: title || `${subject} Episode`,
        source_type: 'text',
        source_content: sourceContent,
        subject,
      })
      .then((res) => {
        setPodcastId(res.data.id)
        startPolling(res.data.id)
      })
      .catch(() => {
        setError('Could not start podcast generation. Please try again.')
      })
  }

  const handleReset = () => {
    setStep(1)
    setSourceContent('')
    setTitle('')
    setSubject('')
    setPodcastId(null)
    setStatus(null)
    setError(null)
    setMessageIndex(0)
  }

  if (step === 4) {
    return (
      <div className="bg-surface rounded-xl p-8 text-center space-y-4">
        {error ? (
          <>
            <p className="text-accent font-medium">{error}</p>
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
            >
              Try Again
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center gap-2">
              <span className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="w-3 h-3 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="w-3 h-3 rounded-full bg-primary animate-bounce" />
            </div>
            <p className="text-text/70">{LOADING_MESSAGES[messageIndex]}</p>
            <p className="text-xs text-text/40">Status: {status || 'starting'}</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-2 text-xs text-text/50">
        <span className={step >= 1 ? 'text-primary font-semibold' : ''}>1. Source</span>
        <span>&rarr;</span>
        <span className={step >= 2 ? 'text-primary font-semibold' : ''}>2. Subject</span>
        <span>&rarr;</span>
        <span className={step >= 3 ? 'text-primary font-semibold' : ''}>3. Review</span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold">What should the episode cover?</h3>
          <ContentUploader onChange={setSourceContent} />
          <button
            disabled={!sourceContent.trim()}
            onClick={() => setStep(2)}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">What subject is this for?</h3>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Biology"
            className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Episode title (optional)"
            className="w-full px-3 py-2 rounded-lg bg-background border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2 rounded-lg bg-white/5 text-text/70 text-sm font-medium hover:bg-white/10"
            >
              Back
            </button>
            <button
              disabled={!subject.trim()}
              onClick={() => setStep(3)}
              className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold">Review &amp; generate</h3>
          <div className="text-sm space-y-2 bg-background rounded-lg p-3">
            <p>
              <span className="text-text/50">Subject:</span> {subject}
            </p>
            <p>
              <span className="text-text/50">Title:</span> {title || `${subject} Episode`}
            </p>
            <p className="text-text/50">Notes preview:</p>
            <p className="text-text/70 line-clamp-3">{sourceContent.slice(0, 200)}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-lg bg-white/5 text-text/70 text-sm font-medium hover:bg-white/10"
            >
              Back
            </button>
            <button
              onClick={handleGenerate}
              className="px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:opacity-90"
            >
              Generate Episode
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
