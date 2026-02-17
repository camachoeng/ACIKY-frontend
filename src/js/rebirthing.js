// Rebirthing page
import { t, localized } from './i18n.js'
import { apiFetch } from './api.js'
import { formatUserName } from './utils/formatUserName.js'

let cachedSessions = []

export async function initRebirthing() {
  updateWhatsAppLink()
  await loadSessions()

  window.addEventListener('languageChanged', () => {
    updateWhatsAppLink()
    const container = document.getElementById('sessionsContainer')
    if (container && !container.classList.contains('hidden')) {
      renderSessions(container, cachedSessions)
    }
  })
}

function updateWhatsAppLink() {
  const whatsappBtn = document.getElementById('whatsappCtaBtn')
  if (!whatsappBtn) return

  const message = t('cta.whatsappMessage')
  const encodedMessage = encodeURIComponent(message)
  whatsappBtn.href = `https://wa.me/5350759360?text=${encodedMessage}`
}

async function loadSessions() {
  const loading = document.getElementById('sessionsLoading')
  const container = document.getElementById('sessionsContainer')
  const empty = document.getElementById('sessionsEmpty')

  try {
    const data = await apiFetch('/api/rebirthing?active=true')
    cachedSessions = data.data || []
    loading?.classList.add('hidden')

    if (cachedSessions.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderSessions(container, cachedSessions)
    }
  } catch {
    loading?.classList.add('hidden')
    empty?.classList.remove('hidden')
  }
}

function renderSessions(container, sessions) {
  container.innerHTML = sessions.map(s => {
    const instructorName = s.instructor_name
      ? formatUserName({ name: s.instructor_name, last_name: s.instructor_last_name, spiritual_name: s.instructor_spiritual_name })
      : null

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div class="flex items-start gap-4">
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-primary text-xl">spa</span>
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-primary-dark mb-2">${escapeHtml(localized(s, 'name'))}</h3>
            ${s.date ? `
            <div class="flex items-center gap-1 text-xs text-primary mb-1">
              <span class="material-symbols-outlined text-xs">calendar_month</span>
              <span>${formatDateTime(s.date)}</span>
            </div>` : ''}
            ${s.address ? `
            <div class="flex items-center gap-1 text-xs text-slate-500 mb-1">
              <span class="material-symbols-outlined text-xs">location_on</span>
              <span>${escapeHtml(s.address)}</span>
            </div>` : ''}
            ${instructorName ? `
            <div class="flex items-center gap-1 text-xs text-slate-400">
              <span class="material-symbols-outlined text-xs">person</span>
              <span>${escapeHtml(instructorName)}</span>
            </div>` : ''}
            ${localized(s, 'description') ? `
            <p class="text-slate-600 text-sm mt-3 leading-relaxed">${escapeHtml(localized(s, 'description'))}</p>` : ''}
          </div>
        </div>
      </div>`
  }).join('')
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) +
    ' · ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
