// Event detail page
import { t, localized, getLanguage } from './i18n.js'
import { apiFetch } from './api.js'

let cachedEvent = null

export async function initEvent() {
  await loadEvent()
  updateWhatsAppLink()

  window.addEventListener('languageChanged', () => {
    updateWhatsAppLink()
    if (cachedEvent) renderEvent(cachedEvent)
  })
}

function updateWhatsAppLink() {
  const btn = document.getElementById('whatsappCtaBtn')
  if (!btn) return
  const name = cachedEvent
    ? (getLanguage() === 'en' && cachedEvent.name_en ? cachedEvent.name_en : cachedEvent.name)
    : ''
  const message = t('cta.whatsappMessage', { name })
  btn.href = `https://wa.me/5350759360?text=${encodeURIComponent(message)}`
}

async function loadEvent() {
  const id = new URLSearchParams(window.location.search).get('id')

  const loading = document.getElementById('eventLoading')
  const notFound = document.getElementById('eventNotFound')
  const content = document.getElementById('eventContent')

  if (!id) {
    loading?.classList.add('hidden')
    notFound?.classList.remove('hidden')
    return
  }

  try {
    const data = await apiFetch(`/api/events/${id}`)
    cachedEvent = data.data || data
    loading?.classList.add('hidden')
    content?.classList.remove('hidden')
    renderEvent(cachedEvent)
  } catch {
    loading?.classList.add('hidden')
    notFound?.classList.remove('hidden')
  }
}

function renderEvent(ev) {
  const lang = getLanguage()
  const name = lang === 'en' && ev.name_en ? ev.name_en : ev.name
  const description = lang === 'en' && ev.description_en ? ev.description_en : ev.description

  // Hero image
  const hero = document.getElementById('eventHero')
  if (hero) {
    if (ev.image_url) {
      hero.innerHTML = `
        <img src="${escapeHtml(ev.image_url)}" alt="${escapeHtml(name)}" class="w-full" />
        <div class="absolute inset-0 bg-gradient-to-t from-primary-dark/80 via-primary-dark/10 to-transparent"></div>
        <div class="absolute bottom-0 left-0 right-0 p-8 text-white">
          <h1 class="text-3xl font-bold">${escapeHtml(name)}</h1>
        </div>`
    } else {
      hero.innerHTML = `
        <div class="aspect-[40/21] w-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          <span class="material-symbols-outlined text-primary text-7xl">event</span>
        </div>`
    }
  }

  // Name (below hero)
  const nameEl = document.getElementById('eventName')
  if (nameEl) nameEl.textContent = name

  // Date
  const dateRow = document.getElementById('eventDateRow')
  const dateEl = document.getElementById('eventDate')
  if (ev.date && dateRow && dateEl) {
    dateEl.textContent = formatDateTime(ev.date)
    dateRow.classList.remove('hidden')
  }

  // Address / Online
  const addressRow = document.getElementById('eventAddressRow')
  const addressIcon = document.getElementById('eventAddressIcon')
  const addressEl = document.getElementById('eventAddress')
  if (addressRow && addressIcon && addressEl) {
    if (ev.is_online) {
      addressIcon.textContent = 'wifi'
      addressEl.textContent = t('online')
      addressEl.className = 'text-accent-teal font-medium'
    } else if (ev.address) {
      addressIcon.textContent = 'location_on'
      addressEl.textContent = ev.address
    } else {
      addressRow.classList.add('hidden')
    }
  }

  // Description
  const descWrap = document.getElementById('eventDescriptionWrap')
  const descEl = document.getElementById('eventDescription')
  if (descWrap && descEl && description) {
    descEl.textContent = description
    descWrap.classList.remove('hidden')
  }

  // External link button
  const externalLink = document.getElementById('eventExternalLink')
  if (externalLink) {
    if (ev.event_url) {
      const isLocal = /^(localhost|127\.0\.0\.1)/i.test(ev.event_url)
      const url = /^https?:\/\//i.test(ev.event_url)
        ? ev.event_url
        : (isLocal ? 'http://' : 'https://') + ev.event_url
      externalLink.href = url
      externalLink.classList.remove('hidden')
    } else {
      externalLink.classList.add('hidden')
    }
  }
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) +
    ' · ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
