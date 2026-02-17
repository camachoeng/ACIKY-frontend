import { apiFetch } from './api.js'
import { t } from './i18n.js'

export function initRegister() {
  const form = document.getElementById('registerForm')
  const errorDiv = document.getElementById('registerError')
  const submitBtn = document.getElementById('registerBtn')

  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorDiv.classList.add('hidden')

    const name = form.name.value.trim()
    const lastName = form.lastName.value.trim()
    const spiritualName = form.spiritualName.value.trim() || undefined
    const email = form.email.value.trim()
    const password = form.password.value
    const confirmPassword = form.confirmPassword.value

    // Client-side validation
    if (password !== confirmPassword) {
      const errorSpan = errorDiv.querySelector('span:last-child')
      if (errorSpan) errorSpan.textContent = t('errors.passwordMismatch')
      else errorDiv.textContent = t('errors.passwordMismatch')
      errorDiv.classList.remove('hidden')
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
      const errorSpan = errorDiv.querySelector('span:last-child')
      if (errorSpan) errorSpan.textContent = err.message || t('errors.default')
      else errorDiv.textContent = err.message || t('errors.default')
      errorDiv.classList.remove('hidden')
      submitBtn.disabled = false
      submitBtn.textContent = t('submitBtn')
    }
  })

  // Listen for language changes
  window.addEventListener('languageChanged', () => {
    if (!submitBtn.disabled) {
      submitBtn.textContent = t('submitBtn')
    }
  })
}
