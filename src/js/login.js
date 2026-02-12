import { apiFetch } from './api.js'
import { t } from './i18n.js'

export function initLogin() {
  const form = document.getElementById('loginForm')
  const errorDiv = document.getElementById('loginError')
  const submitBtn = document.getElementById('loginBtn')
  const successDiv = document.getElementById('loginSuccess')
  const resendDiv = document.getElementById('resendVerification')

  if (!form) return

  const params = new URLSearchParams(window.location.search)
  const infoDiv = document.getElementById('loginInfo')

  // Show success message if redirected from register
  if (params.get('registered') === 'true' && successDiv) {
    const successSpan = successDiv.querySelector('[data-i18n="success.registered"]')
    if (params.get('needsVerification') === 'true' && successSpan) {
      successSpan.textContent = t('success.needsVerification')
    }
    successDiv.classList.remove('hidden')
  }

  // Show info message if redirected for booking or contact
  const reason = params.get('reason')
  if (reason && infoDiv) {
    const infoMessages = {
      booking: 'info.bookingRedirect',
      contact: 'info.contactRedirect'
    }
    const key = infoMessages[reason]
    if (key) {
      const span = infoDiv.querySelector('span:last-child')
      if (span) span.textContent = t(key)
      infoDiv.classList.remove('hidden')
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorDiv.classList.add('hidden')
    if (successDiv) successDiv.classList.add('hidden')
    if (infoDiv) infoDiv.classList.add('hidden')
    if (resendDiv) resendDiv.classList.add('hidden')
    submitBtn.disabled = true
    submitBtn.textContent = t('submitting')

    const email = form.email.value.trim()
    const password = form.password.value

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })

      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('authToken', 'session')
      localStorage.setItem('loginTime', Date.now().toString())

      // Check for return URL (used when redirected from protected pages)
      const returnUrl = params.get('return')
      if (returnUrl) {
        window.location.href = decodeURIComponent(returnUrl)
      } else {
        const base = import.meta.env.BASE_URL
        window.location.href = data.user.role === 'admin' ? base + 'pages/admin/dashboard.html' : base
      }
    } catch (err) {
      const errorSpan = errorDiv.querySelector('span:last-child')
      if (errorSpan) errorSpan.textContent = err.message || t('errors.default')
      else errorDiv.textContent = err.message || t('errors.default')
      errorDiv.classList.remove('hidden')

      // Show resend option if email not verified
      if (err.data && err.data.code === 'EMAIL_NOT_VERIFIED' && resendDiv) {
        resendDiv.classList.remove('hidden')
        setupResendButton(resendDiv, email)
      }

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

function setupResendButton(resendDiv, email) {
  const resendBtn = resendDiv.querySelector('button')
  const resendMsg = resendDiv.querySelector('.resend-message')
  if (!resendBtn) return

  // Remove old listeners by cloning
  const newBtn = resendBtn.cloneNode(true)
  resendBtn.parentNode.replaceChild(newBtn, resendBtn)

  newBtn.addEventListener('click', async () => {
    newBtn.disabled = true
    newBtn.textContent = t('verification.sending')
    try {
      await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      if (resendMsg) {
        resendMsg.textContent = t('verification.resent')
        resendMsg.classList.remove('hidden')
      }
      newBtn.textContent = t('verification.sent')
    } catch (err) {
      if (resendMsg) {
        resendMsg.textContent = err.message || t('verification.resendError')
        resendMsg.classList.remove('hidden')
      }
      newBtn.disabled = false
      newBtn.textContent = t('verification.resendBtn')
    }
  })
}
