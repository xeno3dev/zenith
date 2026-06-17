import { useEffect, useState } from 'react'
import useAuthStore from '../store/authStore'
import api from '../lib/api'

export default function useAuth() {
  const { user, token, isAuthenticated, login, logout, setUser } = useAuthStore()
  const [loading, setLoading] = useState(!!token && !user)

  useEffect(() => {
    let active = true
    if (token && !user) {
      setLoading(true)
      api
        .get('/auth/me')
        .then((res) => {
          if (active) setUser(res.data)
        })
        .catch(() => {
          if (active) logout()
        })
        .finally(() => {
          if (active) setLoading(false)
        })
    } else {
      setLoading(false)
    }
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return { user, isAuthenticated, login, logout, loading }
}
