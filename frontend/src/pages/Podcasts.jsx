import { useEffect, useState } from 'react'
import { Plus, X, Mic } from 'lucide-react'
import api from '../lib/api'
import { cn } from '../lib/utils'
import PodcastGenerator from '../components/podcast/PodcastGenerator'
import PodcastPlayer from '../components/podcast/PodcastPlayer'

const STATUS_COLORS = {
  ready: 'bg-green-500/20 text-green-400 border-green-500/30',
  processing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  failed: 'bg-red-500/20 text-red-400 border-red-500/30',
}

function formatDuration(seconds) {
  if (!seconds) return '--:--'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function Podcasts() {
  const [podcasts, setPodcasts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showGenerator, setShowGenerator] = useState(false)
  const [selectedPodcast, setSelectedPodcast] = useState(null)

  const fetchPodcasts = () => {
    setLoading(true)
    api
      .get('/podcasts')
      .then((res) => setPodcasts(res.data || []))
      .catch(() => setPodcasts([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPodcasts()
  }, [])

  const handleReady = (podcast) => {
    fetchPodcasts()
    setSelectedPodcast(podcast)
    setShowGenerator(false)
  }

  const handleCardClick = (podcast) => {
    if (podcast.status === 'ready') {
      api.get(`/podcasts/${podcast.id}`).then((res) => setSelectedPodcast(res.data))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Podcasts</h1>
          <p className="text-text/60 mt-1">AI-generated study episodes with Ari and Sol.</p>
        </div>
        <button
          onClick={() => {
            setShowGenerator((s) => !s)
            setSelectedPodcast(null)
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90"
        >
          {showGenerator ? <X size={16} /> : <Plus size={16} />}
          {showGenerator ? 'Cancel' : 'New Episode'}
        </button>
      </div>

      {showGenerator && <PodcastGenerator onReady={handleReady} />}

      {selectedPodcast && !showGenerator && (
        <PodcastPlayer podcast={selectedPodcast} />
      )}

      {loading ? (
        <p className="text-sm text-text/50">Loading episodes...</p>
      ) : podcasts.length === 0 ? (
        <div className="bg-surface rounded-xl p-8 text-center text-text/50 text-sm">
          No episodes yet. Generate your first one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {podcasts.map((podcast) => (
            <button
              key={podcast.id}
              onClick={() => handleCardClick(podcast)}
              disabled={podcast.status !== 'ready'}
              className={cn(
                'bg-surface rounded-xl p-4 text-left space-y-2',
                podcast.status === 'ready' ? 'hover:bg-white/5 cursor-pointer' : 'opacity-80 cursor-default'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <Mic className="text-primary shrink-0" size={20} />
                <span
                  className={cn(
                    'text-xs px-2 py-0.5 rounded-full border shrink-0',
                    STATUS_COLORS[podcast.status] || STATUS_COLORS.pending
                  )}
                >
                  {podcast.status}
                </span>
              </div>
              <h3 className="font-semibold text-sm">{podcast.title}</h3>
              <p className="text-xs text-text/50">
                {podcast.subject || podcast.source_type} &middot;{' '}
                {formatDuration(podcast.duration_seconds)}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
