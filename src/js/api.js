// API Configuration
export const API_BASE = window.location.hostname === 'camachoeng.github.io'
  ? 'https://aciky-backend-298cb7d6b0a8.herokuapp.com'
  : window.location.hostname === '192.168.1.70'
  ? 'http://192.168.1.70:3000'
  : 'http://localhost:3000'

/**
 * Get full API URL for a path
 */
export function getApiUrl(path) {
  return `${API_BASE}${path}`
}

/**
 * Fetch wrapper with credentials and JSON handling.
 * Throws on non-ok responses with the server's error message.
 */
export async function apiFetch(path, options = {}) {
  const config = {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }

  // Don't set Content-Type for GET/HEAD (no body) or FormData (browser sets it)
  if (!options.method || options.method === 'GET' || options.method === 'HEAD') {
    delete config.headers['Content-Type']
  }

  // Don't set Content-Type for FormData - let browser set it with boundary
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type']
  }

  const res = await fetch(`${API_BASE}${path}`, config)
  const data = await res.json()

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = import.meta.env.BASE_URL + 'pages/login.html'
      return
    }
    const err = new Error(data.message || 'Request failed')
    err.status = res.status
    err.data = data
    throw err
  }

  return data
}
