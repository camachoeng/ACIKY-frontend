// Online Sadhana page
import { t, getLanguage } from './i18n.js'
import { apiFetch } from './api.js'
import { formatUserName } from './utils/formatUserName.js'
import { getWhatsAppNumber, buildWhatsAppUrl } from './utils/whatsapp.js'

let waPhone = '5350759360'
let programData = null

const DEFAULT_PROGRAM = {
  parts: [
    {
      title_es: 'Primera Parte',
      title_en: 'First Part',
      steps: [
        { text_es: 'Lectura del pauri 35, 11 veces.', text_en: 'Reading of pauri 35, 11 times.' },
        { text_es: 'Adi mantra y mangala chalan mantra.', text_en: 'Adi mantra and mangala chalan mantra.' },
        { text_es: 'Lectura de lista de sanación y bienestar.', text_en: 'Reading of healing and wellness list.' },
        { text_es: '27 ranas.', text_en: '27 frogs.' },
        { text_es: '1 minuto en arco con respiración de fuego.', text_en: '1 minute in bow pose with breath of fire.' },
        { text_es: '30 segundos de descanso y 30 más en bebé.', text_en: '30 seconds of rest and 30 more in baby pose.' },
        { text_es: 'Sat kriya 3 minutos.', text_en: 'Sat kriya 3 minutes.' },
        { text_es: 'Relajación 3 minutos.', text_en: 'Relaxation 3 minutes.' },
        { text_es: 'Meditación Ek ONG kar largo 31 minutos.', text_en: 'Long Ek ONG kar meditation 31 minutes.' },
        { text_es: 'Eterno sol y 3 sat Nam.', text_en: 'Eternal sun and 3 sat Nam.' },
        { text_es: 'Agradecimiento.', text_en: 'Gratitude.' },
        { text_es: 'Lectura y reflexión del dicho del día.', text_en: 'Reading and reflection of the saying of the day.' }
      ]
    },
    {
      title_es: 'Segunda Parte',
      title_en: 'Second Part',
      steps: [
        { text_es: 'Meditación de la prosperidad. 11 minutos.', text_en: 'Prosperity meditation. 11 minutes.' },
        { text_es: 'Un sat Nam largo.', text_en: 'One long sat Nam.' },
        { text_es: 'Seguir reflexionando o fin.', text_en: 'Continue reflecting or end.' }
      ]
    }
  ]
}

export async function initOnlineSadhana() {
  waPhone = await getWhatsAppNumber()
  updateWhatsAppLink()
  await Promise.all([loadParticipants(), loadProgram()])

  window.addEventListener('languageChanged', () => {
    updateWhatsAppLink()
    loadParticipants()
    renderProgram()
  })
}

async function loadProgram() {
  try {
    const data = await apiFetch('/api/settings')
    const raw = data.data?.sadhana_program_json
    programData = raw ? JSON.parse(raw) : DEFAULT_PROGRAM
  } catch {
    programData = DEFAULT_PROGRAM
  }
  renderProgram()
}

function renderProgram() {
  const section = document.getElementById('sadhanaProgramSection')
  const container = document.getElementById('sadhanaProgramContainer')
  if (!section || !container) return

  const lang = getLanguage()
  const parts = programData?.parts || []

  if (parts.length === 0) {
    section.classList.add('hidden')
    return
  }

  section.classList.remove('hidden')
  container.innerHTML = parts.map((part, partIdx) => {
    const title = lang === 'en' ? (part.title_en || part.title_es) : part.title_es
    const steps = part.steps || []
    const isLast = partIdx === parts.length - 1

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="px-6 py-4 bg-primary/5 border-b border-primary/10">
          <h3 class="font-bold text-primary-dark">${escapeHtml(title)}</h3>
        </div>
        <ol class="divide-y divide-slate-50">
          ${steps.map((step, idx) => {
            const text = lang === 'en' ? (step.text_en || step.text_es) : step.text_es
            return `
              <li class="flex items-start gap-4 px-6 py-3">
                <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">${idx + 1}</span>
                <span class="text-slate-700 text-sm leading-relaxed">${escapeHtml(text)}</span>
              </li>`
          }).join('')}
        </ol>
        ${isLast ? '' : '<div class="px-6 py-3 text-center"><span class="material-symbols-outlined text-primary/30 text-2xl">arrow_downward</span></div>'}
      </div>`
  }).join('')
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
