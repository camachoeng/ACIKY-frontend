// Festival page
import { t, getLanguage } from './i18n.js'
import { apiFetch } from './api.js'

let festivalSettings = null

export async function initFestival() {
  updateWhatsAppLink()
  window.addEventListener('languageChanged', () => {
    updateWhatsAppLink()
    renderDynamicSections()
  })

  await loadFestivalSettings()
}

async function loadFestivalSettings() {
  try {
    const data = await apiFetch('/api/festival')
    festivalSettings = data.data || null
  } catch (err) {
    console.warn('Could not load festival settings:', err.message)
  }
  renderDynamicSections()
}

function renderDynamicSections() {
  renderProgram()
  renderEventDetails()
}

function renderProgram() {
  const container = document.getElementById('festivalProgramContainer')
  if (!container) return

  const lang = getLanguage()
  const days = festivalSettings?.program_json

  if (!days || days.length === 0) {
    container.innerHTML = `<p class="text-center text-slate-400 text-sm py-8">${t('program.noData')}</p>`
    return
  }

  container.innerHTML = days.map(day => {
    const title = lang === 'en' ? (day.title_en || day.title_es) : day.title_es
    const theme = lang === 'en' ? (day.theme_en || day.theme_es) : day.theme_es
    const activities = day.activities || []

    return `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div class="mb-4 pb-4 border-b border-slate-200">
        <h3 class="text-xl font-bold text-primary-dark">${escapeHtml(title)}</h3>
        <p class="text-sm text-slate-500 mt-1">${escapeHtml(theme)}</p>
      </div>
      <div class="space-y-3">
        ${activities.map(act => {
          const actTitle = lang === 'en' ? (act.title_en || act.title_es) : act.title_es
          const actDesc = lang === 'en' ? (act.desc_en || act.desc_es) : act.desc_es
          return `
          <div class="flex gap-4">
            <span class="text-primary font-bold text-sm min-w-[70px]">${escapeHtml(act.time)}</span>
            <div>
              <h4 class="font-semibold text-primary-dark text-sm">${escapeHtml(actTitle)}</h4>
              <p class="text-xs text-slate-600">${escapeHtml(actDesc)}</p>
            </div>
          </div>`
        }).join('')}
      </div>
    </div>`
  }).join('')
}

function renderEventDetails() {
  const container = document.getElementById('festivalDetailsContainer')
  if (!container) return

  const lang = getLanguage()
  const s = festivalSettings

  const topic = s ? (lang === 'en' ? (s.topic_en || s.topic_es) : s.topic_es) : null
  const dates = s ? (lang === 'en' ? (s.dates_en || s.dates_es) : s.dates_es) : null
  const duration = s ? (lang === 'en' ? (s.duration_en || s.duration_es) : s.duration_es) : null
  const location = s ? (lang === 'en' ? (s.location_en || s.location_es) : s.location_es) : null
  const earlyBirdTitle = s ? (lang === 'en' ? (s.early_bird_title_en || s.early_bird_title_es) : s.early_bird_title_es) : null
  const earlyBirdText = s ? (lang === 'en' ? (s.early_bird_text_en || s.early_bird_text_es) : s.early_bird_text_es) : null

  container.innerHTML = `
    <h3 class="text-lg font-bold text-primary-dark mb-4">${t('registration.details.title')}</h3>
    <div class="space-y-3">
      ${topic ? `
      <div class="flex gap-3">
        <span class="material-symbols-outlined text-primary text-xl">spa</span>
        <div>
          <p class="text-xs text-slate-500 uppercase font-semibold">${t('registration.details.topic.label')}</p>
          <p class="text-sm text-slate-700">${escapeHtml(topic)}</p>
        </div>
      </div>` : ''}
      <div class="flex gap-3">
        <span class="material-symbols-outlined text-primary text-xl">calendar_month</span>
        <div>
          <p class="text-xs text-slate-500 uppercase font-semibold">${t('registration.details.dates.label')}</p>
          <p class="text-sm text-slate-700">${escapeHtml(dates || t('registration.details.dates.value'))}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <span class="material-symbols-outlined text-primary text-xl">schedule</span>
        <div>
          <p class="text-xs text-slate-500 uppercase font-semibold">${t('registration.details.duration.label')}</p>
          <p class="text-sm text-slate-700">${escapeHtml(duration || t('registration.details.duration.value'))}</p>
        </div>
      </div>
      <div class="flex gap-3">
        <span class="material-symbols-outlined text-primary text-xl">location_on</span>
        <div>
          <p class="text-xs text-slate-500 uppercase font-semibold">${t('registration.details.location.label')}</p>
          <p class="text-sm text-slate-700">${escapeHtml(location || t('registration.details.location.value'))}</p>
        </div>
      </div>
      ${earlyBirdTitle || earlyBirdText ? `
      <div class="mt-4 p-4 bg-primary/5 rounded-xl">
        <p class="text-xs font-semibold text-primary-dark mb-2">${escapeHtml(earlyBirdTitle || '')}</p>
        <p class="text-xs text-slate-600">${escapeHtml(earlyBirdText || '')}</p>
      </div>` : ''}
    </div>`
}

function updateWhatsAppLink() {
  const whatsappBtn = document.getElementById('whatsappCtaBtn')
  if (!whatsappBtn) return

  const message = t('cta.whatsappMessage')
  const encodedMessage = encodeURIComponent(message)
  whatsappBtn.href = `https://wa.me/5350759360?text=${encodedMessage}`
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
