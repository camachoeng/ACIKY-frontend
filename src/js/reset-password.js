import { t } from './i18n.js'
import { apiFetch } from './api.js'

export async function initResetPassword() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')

  if (!token) {
    window.location.href = import.meta.env.BASE_URL + 'pages/forgot-password.html'
    return
  }

  const form = document.getElementById('resetPasswordForm')
  const btn = document.getElementById('resetPasswordBtn')
  const errorEl = document.getElementById('resetPasswordError')
  const successEl = document.getElementById('resetPasswordSuccess')

  let currentErrorKey = null

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const password = document.getElementById('password').value
    const confirmPassword = document.getElementById('confirmPassword').value

    if (password !== confirmPassword) {
      currentErrorKey = 'errors.passwordMismatch'
      showError(currentErrorKey)
      return
    }

    errorEl.classList.add('hidden')
    btn.disabled = true
    btn.textContent = t('submitting')

    try {
      await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      })
      form.classList.add('hidden')
      errorEl.classList.add('hidden')
      successEl.classList.remove('hidden')
    } catch (err) {
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('expired') || msg.includes('invalid')) {
        currentErrorKey = 'errors.invalidToken'
      } else if (msg.includes('password')) {
        currentErrorKey = 'errors.passwordInvalid'
      } else {
        currentErrorKey = 'errors.default'
      }
      showError(currentErrorKey)
      btn.disabled = false
      btn.textContent = t('submitBtn')
    }
  })

  function showError(key) {
    const span = errorEl.querySelector('span:last-child')
    span.textContent = t(key)
    errorEl.classList.remove('hidden')
  }

  window.addEventListener('languageChanged', () => {
    if (currentErrorKey) showError(currentErrorKey)
    if (!btn.disabled) btn.textContent = t('submitBtn')
  })
}
