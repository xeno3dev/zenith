import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('zenith_token'),
  isAuthenticated: !!localStorage.getItem('zenith_token'),

  login: (userData, token) => {
    localStorage.setItem('zenith_token', token)
    set({ user: userData, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('zenith_token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user }),
}))

export default useAuthStore
