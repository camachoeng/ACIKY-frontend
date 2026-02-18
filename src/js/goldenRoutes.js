import { apiFetch } from './api.js'
import { getUser } from './auth.js'
import { localized, t } from './i18n.js'
import { formatUserName } from './utils/formatUserName.js'

let allRoutes = []

export async function initGoldenRoutes() {
  await loadRoutes()
  initRoutesContactCta()

  document.getElementById('routesRetry')
    ?.addEventListener('click', loadRoutes)

  window.addEventListener('languageChanged', () => {
    if (allRoutes.length > 0) renderAll()
  })
}

function initRoutesContactCta() {
  const section = document.getElementById('routesCtaSection')
  const btn = document.getElementById('routesCtaBtn')
  if (!section || !btn) return

  const user = getUser()
  if (!user) {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
      window.location.href = import.meta.env.BASE_URL + 'pages/login.html?reason=contact&return=' + returnUrl
    })
  } else if (user.role === 'instructor' || user.role === 'admin') {
    section.classList.add('hidden')
  }
}

async function loadRoutes() {
  const loading = document.getElementById('routesLoading')
  const error = document.getElementById('routesError')
  const empty = document.getElementById('routesEmpty')
  const activeContainer = document.getElementById('activeRoutesContainer')

  loading?.classList.remove('hidden')
  error?.classList.add('hidden')
  empty?.classList.add('hidden')
  activeContainer?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/routes')
    allRoutes = data.data || []
    loading?.classList.add('hidden')
    renderAll()
  } catch {
    loading?.classList.add('hidden')
    error?.classList.remove('hidden')
  }
}

function renderAll() {
  const active = allRoutes.filter(r => r.status === 'active')
  const planned = allRoutes.filter(r => r.status === 'planning')

  renderActiveRoutes(active)
  renderPlannedRoutes(planned)
  renderImpactStats(allRoutes)
}

function renderActiveRoutes(routes) {
  const container = document.getElementById('activeRoutesContainer')
  const empty = document.getElementById('routesEmpty')
  if (!container) return

  if (routes.length === 0) {
    container.classList.add('hidden')
    empty?.classList.remove('hidden')
    return
  }

  empty?.classList.add('hidden')
  container.classList.remove('hidden')

  container.innerHTML = routes.map(item => {
    const name = localized(item, 'name') || ''
    const desc = localized(item, 'description') || ''

    return `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      ${item.image_url ? `
      <img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(name)}" class="w-full" />` : ''}
      <div class="p-6">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-symbols-outlined text-primary text-xl">route</span>
          <h3 class="font-bold text-primary-dark">${escapeHtml(name)}</h3>
        </div>
        <div class="flex items-center gap-1 text-xs text-slate-500 mb-3">
          <span class="material-symbols-outlined text-xs">location_on</span>
          <span>${escapeHtml(item.origin || '')}</span>
          <span class="material-symbols-outlined text-xs">arrow_forward</span>
          <span>${escapeHtml(item.destination || '')}</span>
        </div>
        <p class="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">${escapeHtml(desc)}</p>
        ${item.start_date || item.end_date ? `
        <div class="flex items-center gap-1 text-xs text-primary mb-2">
          <span class="material-symbols-outlined text-xs">schedule</span>
          <span>${item.start_date ? formatDate(item.start_date) : '---'} → ${item.end_date ? formatDate(item.end_date) : '---'}</span>
        </div>` : ''}
        ${item.instructors && item.instructors.length > 0 ? `
        <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <div class="flex -space-x-1.5">
            ${item.instructors.map(i => i.profile_image_url
              ? `<img src="${escapeHtml(i.profile_image_url)}" alt="${escapeHtml(formatUserName(i))}" class="w-6 h-6 rounded-full object-cover border border-white flex-shrink-0" />`
              : `<div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-white flex-shrink-0"><span class="material-symbols-outlined text-primary" style="font-size:12px">person</span></div>`
            ).join('')}
          </div>
          <span>${escapeHtml(item.instructors.map(i => formatUserName(i)).join(', '))}</span>
        </div>` : ''}
        <div class="flex flex-wrap gap-3 text-xs text-slate-500">
          ${item.participants_count ? `
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-xs text-accent-teal">group</span>
            ${item.participants_count}+ ${escapeHtml(t('routes.participants'))}
          </span>` : ''}
          ${item.spaces_established ? `
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-xs text-accent-terracotta">home</span>
            ${item.spaces_established} ${escapeHtml(t('routes.spaces'))}
          </span>` : ''}
        </div>
      </div>
    </div>`
  }).join('')
}

function renderPlannedRoutes(routes) {
  const section = document.getElementById('plannedSection')
  const container = document.getElementById('plannedRoutesContainer')
  if (!section || !container) return

  if (routes.length === 0) {
    section.classList.add('hidden')
    return
  }

  section.classList.remove('hidden')

  container.innerHTML = routes.map(item => {
    const name = localized(item, 'name') || ''
    const badgeText = t('routes.planned.badge')

    return `
    <div class="bg-white rounded-2xl shadow-sm border border-amber-200/50 p-5">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-bold text-primary-dark text-sm">${escapeHtml(name)}</h3>
        <span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">${escapeHtml(badgeText)}</span>
      </div>
      <div class="flex items-center gap-1 text-xs text-slate-500">
        <span class="material-symbols-outlined text-xs">location_on</span>
        <span>${escapeHtml(item.origin || '')}</span>
        <span class="material-symbols-outlined text-xs">arrow_forward</span>
        <span>${escapeHtml(item.destination || '')}</span>
      </div>
      ${item.start_date || item.end_date ? `
      <p class="text-xs text-amber-600 mt-2 font-medium flex items-center gap-1">
        <span class="material-symbols-outlined text-xs">schedule</span>
        ${item.start_date ? formatDate(item.start_date) : '---'} → ${item.end_date ? formatDate(item.end_date) : '---'}
      </p>` : ''}
      ${item.instructors && item.instructors.length > 0 ? `
      <div class="flex items-center gap-2 text-xs text-slate-500 mt-1">
        <div class="flex -space-x-1.5">
          ${item.instructors.map(i => i.profile_image_url
            ? `<img src="${escapeHtml(i.profile_image_url)}" alt="${escapeHtml(formatUserName(i))}" class="w-5 h-5 rounded-full object-cover border border-white flex-shrink-0" />`
            : `<div class="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center border border-white flex-shrink-0"><span class="material-symbols-outlined text-primary" style="font-size:10px">person</span></div>`
          ).join('')}
        </div>
        <span>${escapeHtml(item.instructors.map(i => formatUserName(i)).join(', '))}</span>
      </div>` : ''}
    </div>`
  }).join('')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  // Split the date string to avoid timezone issues
  const datePart = dateStr.split('T')[0]
  const [year, month, day] = datePart.split('-')
  // Create date in local timezone
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function renderImpactStats(routes) {
  const destinations = new Set()
  let totalParticipants = 0
  let totalSpaces = 0

  routes.forEach(r => {
    if (r.destination) destinations.add(r.destination.split(' - ')[0].trim())
    totalParticipants += r.participants_count || 0
    totalSpaces += r.spaces_established || 0
  })

  const provincesEl = document.getElementById('statProvinces')
  const peopleEl = document.getElementById('statPeople')
  const spacesEl = document.getElementById('statSpaces')

  if (provincesEl) provincesEl.textContent = destinations.size
  if (peopleEl) peopleEl.textContent = totalParticipants > 0 ? `${totalParticipants}+` : '0'
  if (spacesEl) spacesEl.textContent = totalSpaces
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
