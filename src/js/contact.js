import { apiFetch } from './api.js'
import { t } from './i18n.js'
import { getUser } from './auth.js'
import { formatUserName } from './utils/formatUserName.js'

const PROD_EMAIL = 'info.aciky@gmail.com'
const DEV_EMAIL = 'info.aciky@gmail.com'

export function initContact() {
  const user = getUser()

  // Redirect instructor away from contact page
  if (user && user.role === 'instructor') {
    window.location.href = import.meta.env.BASE_URL
    return
  }

  // Redirect non-logged-in users to login
  if (!user) {
    const returnUrl = encodeURIComponent(window.location.pathname + window.location.search)
    window.location.href = import.meta.env.BASE_URL + 'pages/login.html?reason=contact&return=' + returnUrl
    return
  }

  const email = window.location.hostname === 'camachoeng.github.io'
    ? PROD_EMAIL
    : DEV_EMAIL

  const emailLink = document.getElementById('emailLink')
  const emailDisplay = document.getElementById('emailDisplay')
  if (emailLink) emailLink.href = `mailto:${email}`
  if (emailDisplay) emailDisplay.textContent = email

  setupAuthSection()

  document.getElementById('contactForm')
    ?.addEventListener('submit', handleSubmit)
}

function setupAuthSection() {
  const user = getUser()
  const formSection = document.getElementById('contactFormSection')

  if (user) {
    formSection?.classList.remove('hidden')

    const nameField = document.getElementById('contactName')
    const emailField = document.getElementById('contactEmail')
    if (nameField) {
      nameField.value = formatUserName(user)
      nameField.readOnly = true
      nameField.classList.add('bg-slate-50', 'text-slate-500')
    }
    if (emailField) {
      emailField.value = user.email || ''
      emailField.readOnly = true
      emailField.classList.add('bg-slate-50', 'text-slate-500')
    }
  } else {
    formSection?.classList.add('hidden')
  }
}

async function handleSubmit(e) {
  e.preventDefault()

  const btn = document.getElementById('contactSubmitBtn')
  const feedback = document.getElementById('contactFormFeedback')
  const originalText = btn.textContent
  btn.disabled = true
  btn.textContent = t('form.sending')
  hideFeedback(feedback)

  const body = {
    name: document.getElementById('contactName').value.trim(),
    email: document.getElementById('contactEmail').value.trim(),
    phone: document.getElementById('contactPhone').value.trim() || undefined,
    subject: document.getElementById('contactSubject').value,
    message: document.getElementById('contactMessage').value.trim()
  }

  try {
    await apiFetch('/api/contact', {
      method: 'POST',
      body: JSON.stringify(body)
    })
    showFeedback(feedback, t('form.success'), false)
    document.getElementById('contactForm').reset()
    // Restore read-only fields after form reset
    const nameField = document.getElementById('contactName')
    const emailField = document.getElementById('contactEmail')
    if (nameField) nameField.value = body.name
    if (emailField) emailField.value = body.email
  } catch (err) {
    showFeedback(feedback, err.message || t('form.error'), true)
  }

  btn.disabled = false
  btn.textContent = originalText
}

function showFeedback(el, msg, isError) {
  if (!el) return
  el.textContent = msg
  el.className = isError
    ? 'rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600'
    : 'rounded-xl px-4 py-3 text-sm bg-green-50 text-green-600'
}

function hideFeedback(el) {
  if (!el) return
  el.textContent = ''
  el.className = 'hidden rounded-xl px-4 py-3 text-sm'
}
