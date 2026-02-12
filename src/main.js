import './style.css'
import { checkAuth, getUser } from './js/auth.js'
import { apiFetch } from './js/api.js'
import { initI18n, switchLanguage, getLanguage, t, localized } from './js/i18n.js'

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
        <div class="text-xs opacity-70 text-white">${t('hero.noClasses')}</div>`
      return
    }

    container.innerHTML = activities.map(a => `
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-full border-2 border-primary/50 bg-white/20 flex items-center justify-center">
          <span class="text-sm">${a.icon || '🧘'}</span>
        </div>
        <div class="text-xs">
          <p class="font-semibold text-primary-light">${escapeHtml(translateSchedule(a.schedule) || localized(a, 'name'))}</p>
          <p class="opacity-70 text-white">${a.instructor_name ? t('hero.instructor') + ': ' + escapeHtml(a.instructor_name) : escapeHtml(localized(a, 'name'))}</p>
        </div>
      </div>`).join('')
  } catch {
    container.innerHTML = `
      <div class="text-xs opacity-70 text-white">${t('hero.visitSchedule')}</div>`
  }
}

// Home page: load featured testimonials
async function initHomeTestimonials() {
  const container = document.getElementById('homeTestimonialsContainer')
  if (!container) return

  try {
    const data = await apiFetch('/api/testimonials/approved')
    const testimonials = (data.data || []).filter(t => t.featured)

    if (testimonials.length === 0) {
      const section = document.getElementById('homeTestimonialsSection')
      if (section) section.classList.add('hidden')
      return
    }

    container.innerHTML = testimonials.slice(0, 3).map(item => `
      <div class="min-w-[280px] bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <span class="material-symbols-outlined text-primary/20 text-2xl">format_quote</span>
        <p class="text-slate-600 text-sm mt-2 leading-relaxed line-clamp-4">${escapeHtml(localized(item, 'content'))}</p>
        <p class="mt-4 text-primary-dark font-semibold text-sm">${escapeHtml(item.author_name || '')}</p>
      </div>`).join('')
  } catch {
    const section = document.getElementById('homeTestimonialsSection')
    if (section) section.classList.add('hidden')
  }
}

// Home page: load active golden routes
async function initHomeGoldenRoutes() {
  const container = document.getElementById('homeGoldenRoutesContainer')
  if (!container) return

  try {
    const data = await apiFetch('/api/routes?status=active')
    const routes = data.data || []

    if (routes.length === 0) {
      const section = document.getElementById('homeGoldenRoutesSection')
      if (section) section.classList.add('hidden')
      return
    }

    container.innerHTML = routes.slice(0, 4).map(item => `
      <div class="min-w-[280px] bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-primary text-lg">route</span>
          <h4 class="font-bold text-primary-dark text-sm">${escapeHtml(localized(item, 'name'))}</h4>
        </div>
        <div class="flex items-center gap-1 text-xs text-slate-500 mb-2">
          <span class="material-symbols-outlined text-xs">location_on</span>
          <span>${escapeHtml(item.origin || '')}</span>
          <span class="material-symbols-outlined text-xs">arrow_forward</span>
          <span>${escapeHtml(item.destination || '')}</span>
        </div>
        <p class="text-slate-600 text-xs leading-relaxed line-clamp-2">${escapeHtml(localized(item, 'description'))}</p>
      </div>`).join('')
  } catch {
    const section = document.getElementById('homeGoldenRoutesSection')
    if (section) section.classList.add('hidden')
  }
}

// Home page: handle contact CTA for auth state
function initHomeContactCta() {
  const section = document.getElementById('contactCtaSection')
  const btn = document.getElementById('contactCtaBtn')
  if (!section || !btn) return

  const user = getUser()

  // Hide button for instructor only
  if (user && user.role === 'instructor') {
    section.classList.add('hidden')
    return
  }

  // For non-logged-in users: redirect to login
  if (!user) {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = import.meta.env.BASE_URL + 'pages/login.html?reason=contact&return=' + returnUrl
    })
  }
  // For logged-in regular users: allow normal navigation (no preventDefault)
}

// Home page: activities carousel navigation
function initActivitiesCarousel() {
  const carousel = document.getElementById('activitiesCarousel')
  const prevBtn = document.getElementById('activitiesPrevBtn')
  const nextBtn = document.getElementById('activitiesNextBtn')

  if (!carousel || !prevBtn || !nextBtn) return

  const scrollAmount = 240 // Card width (220px) + gap (20px)

  const updateButtonStates = () => {
    const isAtStart = carousel.scrollLeft <= 10
    const isAtEnd = carousel.scrollLeft >= carousel.scrollWidth - carousel.clientWidth - 10

    prevBtn.disabled = isAtStart
    nextBtn.disabled = isAtEnd
  }

  prevBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' })
    setTimeout(updateButtonStates, 300)
  })

  nextBtn.addEventListener('click', () => {
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    setTimeout(updateButtonStates, 300)
  })

  carousel.addEventListener('scroll', updateButtonStates)
  updateButtonStates()
}

// Listen for language changes to re-render home dynamic sections
window.addEventListener('languageChanged', () => {
  initHeroSchedule()
  initHomeTestimonials()
  initHomeGoldenRoutes()
})

function translateSchedule(schedule) {
  if (!schedule) return ''
  const dayMap = {
    'lunes': 'days.monFull', 'martes': 'days.tueFull', 'miercoles': 'days.wedFull', 'miércoles': 'days.wedFull',
    'jueves': 'days.thuFull', 'viernes': 'days.friFull', 'sabado': 'days.satFull', 'sábado': 'days.satFull', 'domingo': 'days.sunFull'
  }
  let result = schedule
  for (const [es, key] of Object.entries(dayMap)) {
    const regex = new RegExp(es, 'i')
    if (regex.test(result)) {
      result = result.replace(regex, t(key))
      break
    }
  }
  return result
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

// Language Toggle
function initLanguageToggle() {
  const toggles = [
    document.getElementById('langToggle'),
    document.getElementById('mobileLangToggle')
  ]
  const toggleTexts = [
    document.getElementById('langToggleText'),
    document.getElementById('mobileLangToggleText')
  ]

  const updateToggleUI = (lang) => {
    toggleTexts.forEach(el => {
      if (el) el.textContent = lang.toUpperCase()
    })
  }

  updateToggleUI(getLanguage())

  const handleToggle = async () => {
    const newLang = getLanguage() === 'es' ? 'en' : 'es'
    await switchLanguage(newLang)
    updateToggleUI(newLang)
  }

  toggles.forEach(toggle => {
    if (toggle) toggle.addEventListener('click', handleToggle)
  })
}

// Page-specific initialization via dynamic imports
async function initPage() {
  const path = window.location.pathname

  const base = import.meta.env.BASE_URL
  if (path === base || path === base + 'index.html') {
    initHeroSchedule()
    initHomeTestimonials()
    initHomeGoldenRoutes()
    initHomeContactCta()
    initActivitiesCarousel()
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
  } else if (path.includes('/pages/posturas.html')) {
    const { initPosturas } = await import('./js/posturas.js')
    initPosturas()
  } else if (path.includes('/pages/videos.html')) {
    const { initVideos } = await import('./js/videos.js')
    initVideos()
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
  } else if (path.includes('/pages/admin/posturas.html')) {
    const { initAdminPosturas } = await import('./js/admin/posturas.js')
    initAdminPosturas()
  } else if (path.includes('/pages/admin/videos.html')) {
    const { initAdminVideos } = await import('./js/admin/videos.js')
    initAdminVideos()
  } else if (path.includes('/pages/admin/blog.html')) {
    const { initAdminBlog } = await import('./js/admin/blog.js')
    initAdminBlog()
  } else if (path.includes('/pages/admin/testimonials.html')) {
    const { initAdminTestimonials } = await import('./js/admin/testimonials.js')
    initAdminTestimonials()
  } else if (path.includes('/pages/blog.html')) {
    const { initBlog } = await import('./js/blog.js')
    initBlog()
  } else if (path.includes('/pages/testimonials.html')) {
    const { initTestimonials } = await import('./js/testimonials.js')
    initTestimonials()
  } else if (path.includes('/pages/admin/golden-routes.html')) {
    const { initAdminGoldenRoutes } = await import('./js/admin/goldenRoutes.js')
    initAdminGoldenRoutes()
  } else if (path.includes('/pages/golden-routes.html')) {
    const { initGoldenRoutes } = await import('./js/goldenRoutes.js')
    initGoldenRoutes()
  } else if (path.includes('/pages/contact.html')) {
    const { initContact } = await import('./js/contact.js')
    initContact()
  } else if (path.includes('/pages/rebirthing.html')) {
    const { initRebirthing } = await import('./js/rebirthing.js')
    initRebirthing()
  } else if (path.includes('/pages/onlinesadhana.html')) {
    const { initOnlineSadhana } = await import('./js/onlinesadhana.js')
    initOnlineSadhana()
  } else if (path.includes('/pages/instructor/my-classes.html')) {
    const { initInstructorClasses } = await import('./js/instructor/my-classes.js')
    initInstructorClasses()
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize i18n first (load translations)
  await initI18n()

  initMobileMenu()
  initLogout()
  initPasswordToggles()
  initLanguageToggle()
  await checkAuth()
  await initPage()
})
