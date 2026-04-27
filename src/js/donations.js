import { getLanguage } from './i18n.js'
import { apiFetch } from './api.js'

export async function initDonations() {
  await loadDescription()
  window.addEventListener('languageChanged', loadDescription)
}

async function loadDescription() {
  try {
    const data = await apiFetch('/api/settings')
    const s = data.data || {}
    const lang = getLanguage()
    const description = lang === 'en' ? (s['donation_description_en'] || s['donation_description_es']) : s['donation_description_es']
    if (description) {
      const el = document.getElementById('donationDescription')
      if (el) el.textContent = description
    }
  } catch {
    // silently keep defaults
  }
}
