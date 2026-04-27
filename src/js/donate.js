import { t } from './i18n.js'
import { apiFetch } from './api.js'

export async function initDonate() {
  await loadPaypal()
  document.getElementById('submitDonationBtn')?.addEventListener('click', submitDonation)
  window.addEventListener('languageChanged', loadPaypal)
}

async function loadPaypal() {
  try {
    const data = await apiFetch('/api/settings')
    const paypalUrl = (data.data || {})['donation_paypal_url']
    if (paypalUrl) {
      document.getElementById('paypalSection')?.classList.remove('hidden')
      const btn = document.getElementById('paypalBtn')
      if (btn) btn.href = paypalUrl
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
  } catch {
    showError(t('confirm.errorSubmit'))
    btn.disabled = false
    btn.querySelector('[data-i18n]').textContent = t('confirm.submit')
  }
}

function showError(msg) {
  const el = document.getElementById('formError')
  if (el) { el.textContent = msg; el.classList.remove('hidden') }
}
