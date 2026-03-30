import { apiFetch } from '../api.js'

const DEFAULT_PHONE = '5350759360'
let cachedPhone = null

/**
 * Returns the WhatsApp phone number from site settings (cached).
 * Falls back to the default number if settings are unavailable.
 */
export async function getWhatsAppNumber() {
  if (cachedPhone !== null) return cachedPhone
  try {
    const data = await apiFetch('/api/settings')
    const phone = ((data.data || {})['whatsapp_number'] || '').replace(/\D/g, '')
    cachedPhone = phone || DEFAULT_PHONE
  } catch {
    cachedPhone = DEFAULT_PHONE
  }
  return cachedPhone
}

export function resetWhatsAppCache() {
  cachedPhone = null
}

export function buildWhatsAppUrl(phone, message) {
  const base = `https://wa.me/${phone}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
