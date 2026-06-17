import { useEffect, useRef, useState, useCallback } from 'react'
import api from '../lib/api'

export function createPodcast(data) {
  return api.post('/podcasts', data).then((res) => res.data)
}

export function usePodcastPoll(id) {
  const [podcast, setPodcast] = useState(null)
  const [polling, setPolling] = useState(false)
  const intervalRef = useRef(null)

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setPolling(false)
  }, [])

  useEffect(() => {
    if (!id) return
    setPolling(true)

    const poll = () => {
      api
        .get(`/podcasts/${id}`)
        .then((res) => {
          setPodcast(res.data)
          if (res.data.status === 'ready' || res.data.status === 'failed') {
            clear()
          }
        })
        .catch(() => {
          clear()
        })
    }

    poll()
    intervalRef.current = setInterval(poll, 3000)

    return () => clear()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return { podcast, polling }
}

export default usePodcastPoll
