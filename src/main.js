import './style.css'
import { checkAuth } from './js/auth.js'
import { apiFetch } from './js/api.js'

// Mobile Menu Toggle
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobileMenuBtn')
  const mobileMenu = document.getElementById('mobileMenu')

  if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden')

      const isExpanded = !mobileMenu.classList.contains('hidden')
      mobileMenuBtn.setAttribute('aria-expanded', isExpanded)
    })

    document.addEventListener('click', (e) => {
      if (!mobileMenuBtn.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.add('hidden')
        mobileMenuBtn.setAttribute('aria-expanded', 'false')
      }
    })
  }
}

// Logout
function initLogout() {
  const logoutBtns = [
    document.getElementById('mobileLogoutBtn'),
    document.getElementById('desktopLogoutBtn')
  ]

  logoutBtns.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', async () => {
        try {
          await apiFetch('/api/auth/logout', { method: 'POST' })
        } catch (err) {
          console.warn('Logout request failed', err)
        }
        localStorage.clear()
        sessionStorage.clear()
        window.location.href = import.meta.env.BASE_URL + 'pages/login.html'
      })
    }
  })
}

// Home page: load hero schedule preview from API
async function initHeroSchedule() {
  const container = document.getElementById('heroSchedulePreview')
  if (!container) return

  try {
    const data = await apiFetch('/api/activities?active=true&limit=2')
    const activities = data.data || []

    if (activities.length === 0) {
      container.innerHTML = `
        <div class="text-xs opacity-70 text-white">No hay clases programadas</div>`
      return
    }

    container.innerHTML = activities.map(a => `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-primary/50 bg-white/20 flex items-center justify-center">
          <span class="text-sm">${a.icon || '🧘'}</span>
        </div>
        <div class="text-xs">
          <p class="font-semibold text-primary-light">${escapeHtml(a.schedule || a.name)}</p>
          <p class="opacity-70 text-white">${a.instructor_name ? 'Instructor: ' + escapeHtml(a.instructor_name) : escapeHtml(a.name)}</p>
        </div>
      </div>`).join('')
  } catch {
    container.innerHTML = `
      <div class="text-xs opacity-70 text-white">Visita la seccion de clases para ver el horario</div>`
  }
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

// Password visibility toggle
function initPasswordToggles() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-password')
    if (!btn) return
    const input = document.getElementById(btn.dataset.target)
    if (!input) return
    const isPassword = input.type === 'password'
    input.type = isPassword ? 'text' : 'password'
    const icon = btn.querySelector('.material-symbols-outlined')
    if (icon) icon.textContent = isPassword ? 'visibility_off' : 'visibility'
  })
}

// Page-specific initialization via dynamic imports
async function initPage() {
  const path = window.location.pathname

  const base = import.meta.env.BASE_URL
  if (path === base || path === base + 'index.html') {
    initHeroSchedule()
  } else if (path.includes('/pages/login.html')) {
    const { initLogin } = await import('./js/login.js')
    initLogin()
  } else if (path.includes('/pages/register.html')) {
    const { initRegister } = await import('./js/register.js')
    initRegister()
  } else if (path.includes('/pages/schedule.html')) {
    const { initSchedule } = await import('./js/schedule.js')
    initSchedule()
  } else if (path.includes('/pages/about.html')) {
    const { initAbout } = await import('./js/about.js')
    initAbout()
  } else if (path.includes('/pages/verify-email.html')) {
    const { initVerifyEmail } = await import('./js/verify-email.js')
    initVerifyEmail()
  } else if (path.includes('/pages/dashboard.html')) {
    const { initDashboard } = await import('./js/dashboard.js')
    initDashboard()
  } else if (path.includes('/pages/admin/dashboard.html')) {
    const { initAdminDashboard } = await import('./js/admin/dashboard.js')
    initAdminDashboard()
  } else if (path.includes('/pages/admin/users.html')) {
    const { initAdminUsers } = await import('./js/admin/users.js')
    initAdminUsers()
  } else if (path.includes('/pages/admin/schedule.html')) {
    const { initAdminSchedule } = await import('./js/admin/schedule.js')
    initAdminSchedule()
  } else if (path.includes('/pages/instructor/my-classes.html')) {
    const { initInstructorClasses } = await import('./js/instructor/my-classes.js')
    initInstructorClasses()
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu()
  initLogout()
  initPasswordToggles()
  checkAuth()
  initPage()
})
