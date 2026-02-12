// Online Sadhana page
import { t } from './i18n.js'

export function initOnlineSadhana() {
  updateWhatsAppLink()

  // Update WhatsApp link when language changes
  window.addEventListener('languageChanged', updateWhatsAppLink)
}

function updateWhatsAppLink() {
  const whatsappBtn = document.getElementById('whatsappCtaBtn')
  if (!whatsappBtn) return

  const message = t('cta.whatsappMessage')
  const encodedMessage = encodeURIComponent(message)
  whatsappBtn.href = `https://wa.me/5350759360?text=${encodedMessage}`
}
