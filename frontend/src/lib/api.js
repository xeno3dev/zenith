import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zenith_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Token refresh state — shared across all in-flight requests
let isRefreshing = false
let pendingQueue = [] // [{ resolve, reject }]

function drainQueue(error, newToken) {
  pendingQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(newToken)
  )
  pendingQueue = []
}

function clearSession() {
  localStorage.removeItem('zenith_token')
  localStorage.removeItem('zenith_refresh_token')
  localStorage.removeItem('zenith_user')
  window.location.href = '/login'
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // Only attempt refresh on 401, and not for the refresh/login endpoints themselves
    const isAuthEndpoint =
      originalRequest.url === '/auth/refresh' ||
      originalRequest.url === '/auth/login' ||
      originalRequest.url === '/auth/register'

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true

      const refreshToken = localStorage.getItem('zenith_refresh_token')
      if (!refreshToken) {
        clearSession()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Another request is already refreshing — queue this one
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject })
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        })
      }

      isRefreshing = true
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, {
          headers: { Authorization: `Bearer ${refreshToken}` },
        })
        const newToken = data.access_token
        localStorage.setItem('zenith_token', newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        drainQueue(null, newToken)
        originalRequest.headers.Authorization = `Bearer ${newToken}`
        return api(originalRequest)
      } catch (refreshError) {
        drainQueue(refreshError, null)
        clearSession()
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api
