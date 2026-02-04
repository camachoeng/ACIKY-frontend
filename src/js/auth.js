import { apiFetch } from './api.js'

let currentUser = null

export async function checkAuth() {
  try {
    const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken')
    const loginTime = localStorage.getItem('loginTime') || sessionStorage.getItem('loginTime')
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')

    const tokenValid = authToken && loginTime && storedUser &&
      (Date.now() - parseInt(loginTime)) < (24 * 60 * 60 * 1000)

    const data = await apiFetch('/api/auth/check')
    const isAuthenticated = data.isAuthenticated || tokenValid
    const user = data.user || (tokenValid ? JSON.parse(storedUser) : null)

    if (isAuthenticated && user) {
      currentUser = user
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('loginTime', Date.now().toString())
    } else {
      currentUser = null
      localStorage.removeItem('user')
      localStorage.removeItem('loginTime')
    }

    updateAuthUI(isAuthenticated, user)
    return currentUser
  } catch (error) {
    console.error('Auth check failed:', error)
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user')
    if (storedUser) {
      currentUser = JSON.parse(storedUser)
      updateAuthUI(true, currentUser)
    }
    return currentUser
  }
}

export function getUser() {
  return currentUser
}

export function updateAuthUI(isAuthenticated, user) {
  const authButtons = document.getElementById('authButtons')
  const userMenu = document.getElementById('userMenu')
  const userDisplayName = document.getElementById('userDisplayName')
  const mobileAuthButtons = document.getElementById('mobileAuthButtons')
  const mobileUserMenu = document.getElementById('mobileUserMenu')
  const adminLink = document.getElementById('adminLink')
  const mobileAdminLink = document.getElementById('mobileAdminLink')

  if (isAuthenticated && user) {
    if (authButtons) authButtons.style.display = 'none'
    if (userMenu) {
      userMenu.style.display = 'flex'
      if (userDisplayName) {
        userDisplayName.textContent = `Hola, ${user.username || user.name || ''}`
      }
    }
    if (mobileAuthButtons) mobileAuthButtons.style.display = 'none'
    if (mobileUserMenu) mobileUserMenu.style.display = 'block'
    // Show admin links only for admins
    if (adminLink) adminLink.style.display = user.role === 'admin' ? 'inline-flex' : 'none'
    if (mobileAdminLink) mobileAdminLink.style.display = user.role === 'admin' ? 'block' : 'none'
  } else {
    if (authButtons) authButtons.style.display = 'flex'
    if (userMenu) userMenu.style.display = 'none'
    if (mobileAuthButtons) mobileAuthButtons.style.display = 'block'
    if (mobileUserMenu) mobileUserMenu.style.display = 'none'
    if (adminLink) adminLink.style.display = 'none'
    if (mobileAdminLink) mobileAdminLink.style.display = 'none'
  }
}

/** Redirect to login if not authenticated. Returns the user or null. */
export async function requireAuth() {
  const user = await checkAuth()
  if (!user) {
    window.location.href = import.meta.env.BASE_URL + 'pages/login.html'
    return null
  }
  return user
}

/** Redirect to home if not admin. Returns the user or null. */
export async function requireAdmin() {
  const user = await requireAuth()
  if (!user) return null
  if (user.role !== 'admin') {
    window.location.href = import.meta.env.BASE_URL
    return null
  }
  return user
}
