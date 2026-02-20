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

    const sessionName = localized(s, 'name')
    const bookMessage = t('sessions.bookMessage', { name: sessionName })
    const whatsappUrl = `https://wa.me/5350759360?text=${encodeURIComponent(bookMessage)}`

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        ${s.image ? `
        <img src="${escapeHtml(s.image)}" alt="${escapeHtml(sessionName)}" class="w-full" />` : ''}
        <div class="p-6">
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <span class="material-symbols-outlined text-primary text-xl">spa</span>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-primary-dark mb-2">${escapeHtml(sessionName)}</h3>
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
              <div class="flex items-center gap-1.5 text-xs text-slate-400">
                ${s.instructor_profile_image_url
                  ? `<img src="${escapeHtml(s.instructor_profile_image_url)}" alt="${escapeHtml(instructorName)}" class="w-5 h-5 rounded-full object-cover flex-shrink-0" />`
                  : `<span class="material-symbols-outlined text-xs">person</span>`}
                <span>${escapeHtml(instructorName)}</span>
              </div>` : ''}
              ${localized(s, 'description') ? `
              <p class="text-slate-600 text-sm mt-3 leading-relaxed">${escapeHtml(localized(s, 'description'))}</p>` : ''}
            </div>
          </div>
          <div class="mt-4 flex justify-end">
            <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-2xl hover:bg-primary transition-colors">
              ${t('sessions.book')}
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.149-2.868.852.852-2.868-.149-.252A8 8 0 1112 20z"/></svg>
            </a>
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
