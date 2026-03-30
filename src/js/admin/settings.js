import { apiFetch } from '../api.js'
import { requireAdmin } from '../auth.js'
import { t } from '../i18n.js'
import { resetWhatsAppCache } from '../utils/whatsapp.js'

export async function initAdminSettings() {
  requireAdmin()
  await loadWhatsAppNumber()

  document.getElementById('whatsappSaveBtn')
    ?.addEventListener('click', saveWhatsAppNumber)

  document.getElementById('whatsappInput')
    ?.addEventListener('input', updatePreview)
}

async function loadWhatsAppNumber() {
  try {
    const data = await apiFetch('/api/settings')
    const phone = (data.data || {})['whatsapp_number'] || ''
    const input = document.getElementById('whatsappInput')
    if (input && phone) {
      input.value = phone
      updatePreview()
    }
  } catch {
    showFeedback(t('errors.loadError'), true)
  }
}

async function saveWhatsAppNumber() {
  const input = document.getElementById('whatsappInput')
  const phone = (input?.value || '').replace(/\D/g, '').trim()

  if (!phone) {
    showFeedback(t('whatsapp.errorEmpty'), true)
    return
  }

  const btn = document.getElementById('whatsappSaveBtn')
  btn.disabled = true

  try {
    await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ whatsapp_number: phone })
    })
    resetWhatsAppCache()
    if (input) input.value = phone
    updatePreview()
    showFeedback(t('whatsapp.saved'), false)
  } catch {
    showFeedback(t('errors.saveError'), true)
  } finally {
    btn.disabled = false
  }
}

function updatePreview() {
  const input = document.getElementById('whatsappInput')
  const phone = (input?.value || '').replace(/\D/g, '')
  const preview = document.getElementById('whatsappPreview')
  const link = document.getElementById('whatsappPreviewLink')
  if (!preview || !link) return

  if (phone) {
    const url = `https://wa.me/${phone}`
    link.href = url
    link.textContent = url
    preview.classList.remove('hidden')
  } else {
    preview.classList.add('hidden')
  }
}

function showFeedback(msg, isError) {
  const el = document.getElementById('whatsappFeedback')
  if (!el) return
  el.textContent = msg
  el.className = isError
    ? 'rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600'
    : 'rounded-xl px-4 py-3 text-sm bg-green-50 text-green-600'
  setTimeout(() => { el.className = 'hidden rounded-xl px-4 py-3 text-sm' }, 4000)
}
