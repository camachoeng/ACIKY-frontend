// Donations page
import { t, getLanguage } from './i18n.js'
import { apiFetch } from './api.js'

export async function initDonations() {
  await loadConfig()
  document.getElementById('submitDonationBtn')?.addEventListener('click', submitDonation)
  window.addEventListener('languageChanged', () => loadConfig())
}

async function loadConfig() {
  try {
    const data = await apiFetch('/api/settings')
    const s = data.data || {}
    const lang = getLanguage()

    const paypalUrl = s['donation_paypal_url']
    const descEs = s['donation_description_es']
    const descEn = s['donation_description_en']
    const description = lang === 'en' ? (descEn || descEs) : descEs

    if (paypalUrl) {
      const section = document.getElementById('paypalSection')
      const btn = document.getElementById('paypalBtn')
      if (section) section.classList.remove('hidden')
      if (btn) btn.href = paypalUrl
    }

    if (description) {
      const el = document.getElementById('donationDescription')
      if (el) el.textContent = description
    }
  } catch {
    // silently keep defaults
  }
}

async function submitDonation() {
  const btn = document.getElementById('submitDonationBtn')
  const errorEl = document.getElementById('formError')

  const name = document.getElementById('donorName')?.value.trim()
  const email = document.getElementById('donorEmail')?.value.trim()
  const amount = parseFloat(document.getElementById('donorAmount')?.value)
  const currency = document.getElementById('donorCurrency')?.value || 'USD'
  const transactionRef = document.getElementById('donorTransactionRef')?.value.trim()
  const notes = document.getElementById('donorNotes')?.value.trim()

  if (errorEl) errorEl.classList.add('hidden')

  if (!name || !email || !amount) {
    showError(t('confirm.errorRequired'))
    return
  }
  if (isNaN(amount) || amount <= 0) {
    showError(t('confirm.errorAmount'))
    return
  }

  btn.disabled = true
  btn.querySelector('[data-i18n]').textContent = t('confirm.submitting')

  try {
    await apiFetch('/api/donations', {
      method: 'POST',
      body: JSON.stringify({ name, email, amount, currency, payment_method: 'paypal', transaction_ref: transactionRef || null, notes: notes || null })
    })
    document.getElementById('confirmForm')?.classList.add('hidden')
    document.getElementById('successState')?.classList.remove('hidden')
  } catch (err) {
    showError(t('confirm.errorSubmit'))
    btn.disabled = false
    btn.querySelector('[data-i18n]').textContent = t('confirm.submit')
  }
}

function showError(msg) {
  const el = document.getElementById('formError')
  if (el) { el.textContent = msg; el.classList.remove('hidden') }
}
