import { create } from 'zustand'

function loadUser() {
  try {
    const raw = localStorage.getItem('zenith_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const useAuthStore = create((set) => ({
  user: loadUser(),
  token: localStorage.getItem('zenith_token'),
  refreshToken: localStorage.getItem('zenith_refresh_token'),
  isAuthenticated: !!localStorage.getItem('zenith_token'),

  login: (userData, accessToken, refreshToken) => {
    localStorage.setItem('zenith_token', accessToken)
    if (refreshToken) localStorage.setItem('zenith_refresh_token', refreshToken)
    localStorage.setItem('zenith_user', JSON.stringify(userData))
    set({ user: userData, token: accessToken, refreshToken: refreshToken ?? null, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('zenith_token')
    localStorage.removeItem('zenith_refresh_token')
    localStorage.removeItem('zenith_user')
    set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
  },

  setUser: (user) => {
    localStorage.setItem('zenith_user', JSON.stringify(user))
    set({ user })
  },

  setAccessToken: (accessToken) => {
    localStorage.setItem('zenith_token', accessToken)
    set({ token: accessToken })
  },
}))

export default useAuthStore
