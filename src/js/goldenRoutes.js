import { apiFetch, API_BASE } from './api.js'
import { getUser } from './auth.js'
import { localized, t, getLanguage } from './i18n.js'
import { formatUserName } from './utils/formatUserName.js'
import { shareContent } from './utils/share.js'
import { getWhatsAppNumber, buildWhatsAppUrl } from './utils/whatsapp.js'

let allRoutes = []
let waPhone = '5350759360'

export async function initGoldenRoutes() {
  waPhone = await getWhatsAppNumber()
  await loadRoutes()
  loadVisionSettings()
  initRoutesContactCta()
  updateInvolveLinks()

  document.getElementById('routesRetry')
    ?.addEventListener('click', loadRoutes)

  document.getElementById('activeRoutesContainer')
    ?.addEventListener('click', (e) => {
      const btn = e.target.closest('.route-share-btn')
      if (!btn) return
      const name = btn.dataset.routeName
      const id = btn.dataset.shareId
      const url = id ? `${API_BASE}/share/route/${id}` : window.location.href
      shareContent({ title: name, text: name, url })
    })

  window.addEventListener('languageChanged', () => {
    if (allRoutes.length > 0) renderAll()
    loadVisionSettings()
    updateInvolveLinks()
  })
}

async function loadVisionSettings() {
  try {
    const data = await apiFetch('/api/settings')
    const s = data.data || {}
    const isEn = getLanguage() !== 'es'
    const sectionTitle = document.getElementById('visionSectionTitle')
    const sectionTitleVal = isEn ? (s['vision_section_title_en'] || s['vision_section_title']) : s['vision_section_title']
    if (sectionTitle && sectionTitleVal) sectionTitle.textContent = sectionTitleVal
    const goals = ['goal2025', 'goal2026', 'goal2027']
    goals.forEach(goal => {
      const key = goal.charAt(0).toUpperCase() + goal.slice(1)
      const titleEl = document.getElementById(`vision${key}Title`)
      const textEl = document.getElementById(`vision${key}Text`)
      const titleVal = isEn ? (s[`vision_${goal}_title_en`] || s[`vision_${goal}_title`]) : s[`vision_${goal}_title`]
      const textVal = isEn ? (s[`vision_${goal}_text_en`] || s[`vision_${goal}_text`]) : s[`vision_${goal}_text`]
      if (titleEl && titleVal) titleEl.textContent = titleVal
      if (textEl && textVal) textEl.textContent = textVal
    })
  } catch {
    // silently keep i18n defaults
  }
}

function updateInvolveLinks() {
  const map = {
    involveInstructorBtn: 'involve.instructor.whatsappMessage',
    involveHostBtn: 'involve.host.whatsappMessage',
    involveLeaderBtn: 'involve.leader.whatsappMessage',
    involveSponsorBtn: 'involve.sponsor.whatsappMessage',
  }
  for (const [id, key] of Object.entries(map)) {
    const btn = document.getElementById(id)
    if (btn) btn.href = buildWhatsAppUrl(waPhone, t(key))
  }
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

function sortRoutes(routes) {
  // Planning first (sorted by start_date asc), then active (newest first), then others
  const order = { planning: 0, active: 1 }
  return [...routes].sort((a, b) => {
    const aOrder = order[a.status] ?? 2
    const bOrder = order[b.status] ?? 2
    if (aOrder !== bOrder) return aOrder - bOrder
    // Within same status: planning by start_date asc, active by start_date desc (newest first)
    const aDate = a.start_date ? new Date(a.start_date) : null
    const bDate = b.start_date ? new Date(b.start_date) : null
    if (!aDate && !bDate) return 0
    if (!aDate) return 1
    if (!bDate) return -1
    return a.status === 'planning' ? aDate - bDate : bDate - aDate
  })
}

function renderAll() {
  renderAllRoutes(sortRoutes(allRoutes))
  renderImpactStats(allRoutes)
}

function renderAllRoutes(routes) {
  const container = document.getElementById('activeRoutesContainer')
  const empty = document.getElementById('routesEmpty')
  const plannedSection = document.getElementById('plannedSection')
  if (!container) return

  // Hide the old planned section (routes are now unified)
  if (plannedSection) plannedSection.classList.add('hidden')

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
    const isPlanning = item.status === 'planning'

    return `
    <div class="bg-white rounded-2xl shadow-sm border ${isPlanning ? 'border-amber-200/50' : 'border-slate-100'} overflow-hidden flex flex-col">
      <div class="h-52 bg-slate-100 flex-shrink-0 overflow-hidden">
        ${item.image_url
          ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(name)}" class="w-full h-full object-cover" />`
          : `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-slate-300 text-5xl">route</span></div>`}
      </div>
      <div class="p-6 flex flex-col flex-1">
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="material-symbols-outlined text-primary text-xl flex-shrink-0">route</span>
            <h3 class="font-bold text-primary-dark truncate">${escapeHtml(name)}</h3>
          </div>
          ${isPlanning ? `<span class="flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">${escapeHtml(t('routes.planned.badge'))}</span>` : ''}
        </div>
        <div class="flex items-center gap-1 text-xs text-slate-500 mb-3">
          <span class="material-symbols-outlined text-xs">location_on</span>
          <span>${escapeHtml(item.origin || '')}</span>
          <span class="material-symbols-outlined text-xs">arrow_forward</span>
          <span>${escapeHtml(item.destination || '')}</span>
        </div>
        ${desc ? `<p class="text-slate-600 text-sm leading-relaxed mb-4">${escapeHtml(desc)}</p>` : ''}
        ${item.start_date || item.end_date ? `
        <div class="flex items-center gap-1 text-xs ${isPlanning ? 'text-amber-600' : 'text-primary'} mb-2">
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
        <div class="mt-4 pt-4 border-t border-slate-100 flex justify-end">
          <button class="route-share-btn inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
                  data-route-name="${escapeHtml(name)}"
                  data-share-id="${item.id}">
            <span class="material-symbols-outlined text-sm">share</span>
            <span>${escapeHtml(t('common.share'))}</span>
          </button>
        </div>
      </div>
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
