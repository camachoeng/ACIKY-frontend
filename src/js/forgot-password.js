import { t } from './i18n.js'
import { apiFetch } from './api.js'

export async function initForgotPassword() {
  const form = document.getElementById('forgotPasswordForm')
  const btn = document.getElementById('forgotPasswordBtn')
  const errorEl = document.getElementById('forgotPasswordError')
  const successEl = document.getElementById('forgotPasswordSuccess')

  let currentErrorKey = null

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const email = document.getElementById('email').value.trim()

    errorEl.classList.add('hidden')
    successEl.classList.add('hidden')
    btn.disabled = true
    btn.textContent = t('submitting')

    try {
      await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      // Generic success — never reveal whether email exists
      form.reset()
      successEl.classList.remove('hidden')
    } catch {
      // Only show error for genuine network/server failures
      currentErrorKey = 'errors.default'
      showError(currentErrorKey)
    } finally {
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
