import { apiFetch } from './api.js'
import { t } from './i18n.js'
import { formatUserShortName } from './utils/formatUserName.js'

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
  const mobileUserGreeting = document.getElementById('mobileUserGreeting')
  const adminLink = document.getElementById('adminLink')
  const mobileAdminLink = document.getElementById('mobileAdminLink')

  if (isAuthenticated && user) {
    // Hide auth buttons when logged in
    if (authButtons) {
      authButtons.classList.add('hidden')
    }
    // Show user menu
    if (userMenu) {
      userMenu.classList.remove('hidden')
      userMenu.classList.add('flex')
      if (userDisplayName) {
        userDisplayName.textContent = t('header.greeting', { name: formatUserShortName(user) })
      }
    }
    // Mobile: hide auth, show user menu with greeting
    if (mobileAuthButtons) mobileAuthButtons.classList.add('hidden')
    if (mobileUserMenu) mobileUserMenu.classList.remove('hidden')
    if (mobileUserGreeting) {
      mobileUserGreeting.textContent = t('header.greeting', { name: formatUserShortName(user) })
    }
    // Show admin links only for admins (desktop and mobile)
    const isAdmin = user.role === 'admin'
    if (adminLink) {
      if (isAdmin) {
        adminLink.classList.remove('hidden')
        adminLink.classList.add('inline-flex')
      } else {
        adminLink.classList.add('hidden')
        adminLink.classList.remove('inline-flex')
      }
    }
    if (mobileAdminLink) {
      if (isAdmin) {
        mobileAdminLink.classList.remove('hidden')
        mobileAdminLink.classList.add('flex')
      } else {
        mobileAdminLink.classList.add('hidden')
        mobileAdminLink.classList.remove('flex')
      }
    }
  } else {
    // Show auth buttons when logged out
    if (authButtons) {
      authButtons.classList.remove('hidden')
    }
    // Hide user menu
    if (userMenu) {
      userMenu.classList.add('hidden')
      userMenu.classList.remove('flex')
    }
    // Mobile: show auth, hide user menu
    if (mobileAuthButtons) mobileAuthButtons.classList.remove('hidden')
    if (mobileUserMenu) mobileUserMenu.classList.add('hidden')
    if (adminLink) {
      adminLink.classList.add('hidden')
      adminLink.classList.remove('inline-flex')
    }
    if (mobileAdminLink) {
      mobileAdminLink.classList.add('hidden')
      mobileAdminLink.classList.remove('flex')
    }
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

/** Redirect to home if not instructor or admin. Returns the user or null. */
export async function requireInstructor() {
  const user = await requireAuth()
  if (!user) return null
  if (!['admin', 'instructor'].includes(user.role)) {
    window.location.href = import.meta.env.BASE_URL
    return null
  }
  return user
}

// Update greeting on language change
window.addEventListener('languageChanged', () => {
  if (currentUser) {
    updateAuthUI(true, currentUser)
  }
})
