import { useEffect, useRef, useState } from 'react'
import { Play, Pause, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '../../lib/utils'
import ScriptViewer from './ScriptViewer'

const SPEEDS = [0.75, 1, 1.25, 1.5]

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function PodcastPlayer({ podcast }) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(podcast.duration_seconds || 0)
  const [speed, setSpeed] = useState(1)
  const [showScript, setShowScript] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const handleSeek = (e) => {
    const audio = audioRef.current
    const value = Number(e.target.value)
    if (audio) audio.currentTime = value
    setCurrentTime(value)
  }

  const handleSpeed = (s) => {
    setSpeed(s)
    if (audioRef.current) audioRef.current.playbackRate = s
  }

  return (
    <div className="bg-surface rounded-xl p-5 space-y-4">
      <audio ref={audioRef} src={`/api/podcasts/${podcast.id}/audio`} className="hidden" />

      <div>
        <h3 className="font-semibold">{podcast.title}</h3>
        <p className="text-sm text-text/50">
          {podcast.subject || podcast.source_type} &middot; {formatTime(podcast.duration_seconds || duration)}
        </p>
      </div>

      <div className="flex items-end gap-1 h-12">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-full bg-primary/60',
              isPlaying ? 'animate-pulse' : ''
            )}
            style={{
              height: isPlaying ? `${20 + ((i * 37) % 80)}%` : '20%',
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 shrink-0"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <span className="text-xs text-text/50 w-10">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || podcast.duration_seconds || 0}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 accent-primary"
        />
        <span className="text-xs text-text/50 w-10">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-text/50 mr-1">Speed:</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => handleSpeed(s)}
            className={cn(
              'text-xs px-2 py-1 rounded-full font-medium transition-colors',
              speed === s ? 'bg-primary text-white' : 'bg-white/5 text-text/60 hover:bg-white/10'
            )}
          >
            {s}x
          </button>
        ))}
      </div>

      <div>
        <button
          onClick={() => setShowScript((s) => !s)}
          className="flex items-center gap-1 text-sm text-text/70 hover:text-text"
        >
          {showScript ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showScript ? 'Hide transcript' : 'Show transcript'}
        </button>
        {showScript && (
          <div className="mt-3">
            <ScriptViewer script={podcast.script} currentIndex={null} />
          </div>
        )}
      </div>
    </div>
  )
}
