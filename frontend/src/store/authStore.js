import { create } from 'zustand'

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('scholara_token'),
  isAuthenticated: !!localStorage.getItem('scholara_token'),

  login: (userData, token) => {
    localStorage.setItem('scholara_token', token)
    set({ user: userData, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('scholara_token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user) => set({ user }),
}))

export default useAuthStore
