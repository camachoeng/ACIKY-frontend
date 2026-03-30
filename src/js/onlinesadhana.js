// Online Sadhana page
import { t } from './i18n.js'
import { apiFetch } from './api.js'
import { formatUserName } from './utils/formatUserName.js'
import { getWhatsAppNumber, buildWhatsAppUrl } from './utils/whatsapp.js'

let waPhone = '5350759360'

export async function initOnlineSadhana() {
  waPhone = await getWhatsAppNumber()
  updateWhatsAppLink()
  loadParticipants()

  window.addEventListener('languageChanged', () => {
    updateWhatsAppLink()
    loadParticipants()
  })
}

function updateWhatsAppLink() {
  const whatsappBtn = document.getElementById('whatsappCtaBtn')
  if (!whatsappBtn) return
  const message = t('cta.whatsappMessage')
  whatsappBtn.href = buildWhatsAppUrl(waPhone, message)
}

async function loadParticipants() {
  const section = document.getElementById('sadhanaParticipantsSection')
  const grid = document.getElementById('sadhanaParticipantsGrid')
  if (!section || !grid) return

  try {
    const data = await apiFetch('/api/sadhana/participants')
    const participants = data.data || []

    if (participants.length === 0) {
      section.classList.add('hidden')
      return
    }

    section.classList.remove('hidden')
    grid.innerHTML = participants.map(p => {
      const name = escapeHtml(formatUserName(p))
      const img = p.profile_image_url
        ? `<img src="${escapeHtml(p.profile_image_url)}" alt="${name}" class="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md" onerror="this.onerror=null;this.src='/images/default-avatar.svg'" />`
        : `<div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow-md"><span class="material-symbols-outlined text-slate-400">person</span></div>`

      return `
        <div class="relative group flex flex-col items-center">
          ${img}
          <span class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-primary-dark text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
            ${name}
          </span>
        </div>`
    }).join('')
  } catch {
    // silently hide section on error
    section.classList.add('hidden')
  }
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
