import { apiFetch } from './api.js'
import { t } from './i18n.js'

export function initRegister() {
  const form = document.getElementById('registerForm')
  const errorDiv = document.getElementById('registerError')
  const submitBtn = document.getElementById('registerBtn')

  if (!form) return

  let currentErrorKey = null

  function showError(key) {
    currentErrorKey = key
    const errorSpan = errorDiv.querySelector('span:last-child')
    const msg = t(key)
    if (errorSpan) errorSpan.textContent = msg
    else errorDiv.textContent = msg
    errorDiv.classList.remove('hidden')
  }

  function hideError() {
    errorDiv.classList.add('hidden')
    currentErrorKey = null
  }

  function getErrorKey(errMessage) {
    const msg = (errMessage || '').toLowerCase()
    if (msg.includes('password')) return 'errors.passwordInvalid'
    if (msg.includes('email') || msg.includes('already') || msg.includes('exist')) return 'errors.emailTaken'
    return 'errors.default'
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    hideError()

    const name = form.name.value.trim()
    const lastName = form.lastName.value.trim()
    const spiritualName = form.spiritualName.value.trim() || undefined
    const email = form.email.value.trim()
    const password = form.password.value
    const confirmPassword = form.confirmPassword.value

    // Client-side validation
    if (password !== confirmPassword) {
      showError('errors.passwordMismatch')
      return
    }

    submitBtn.disabled = true
    submitBtn.textContent = t('submitting')

    try {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          last_name: lastName,
          spiritual_name: spiritualName,
          email,
          password
        })
      })

      const redirectParams = data.emailVerified
        ? 'registered=true'
        : 'registered=true&needsVerification=true'

      window.location.href = `${import.meta.env.BASE_URL}pages/login.html?${redirectParams}`
    } catch (err) {
      showError(getErrorKey(err.message))
      submitBtn.disabled = false
      submitBtn.textContent = t('submitBtn')
    }
  })

  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    if (!submitBtn.disabled) {
      submitBtn.textContent = t('submitBtn')
    }
    if (currentErrorKey) {
      showError(currentErrorKey)
    }
  })
}
