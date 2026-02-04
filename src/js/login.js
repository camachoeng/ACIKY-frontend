import { apiFetch } from './api.js'

export function initLogin() {
  const form = document.getElementById('loginForm')
  const errorDiv = document.getElementById('loginError')
  const submitBtn = document.getElementById('loginBtn')
  const successDiv = document.getElementById('loginSuccess')
  const resendDiv = document.getElementById('resendVerification')

  if (!form) return

  // Show success message if redirected from register
  const params = new URLSearchParams(window.location.search)
  if (params.get('registered') === 'true' && successDiv) {
    const successSpan = successDiv.querySelector('span:last-child')
    if (params.get('needsVerification') === 'true') {
      if (successSpan) successSpan.textContent = 'Cuenta creada exitosamente. Revisa tu correo electronico para verificar tu cuenta.'
    }
    successDiv.classList.remove('hidden')
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorDiv.classList.add('hidden')
    if (successDiv) successDiv.classList.add('hidden')
    if (resendDiv) resendDiv.classList.add('hidden')
    submitBtn.disabled = true
    submitBtn.textContent = 'Iniciando...'

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

      window.location.href = data.user.role === 'admin' ? '/pages/admin/dashboard.html' : '/'
    } catch (err) {
      const errorSpan = errorDiv.querySelector('span:last-child')
      if (errorSpan) errorSpan.textContent = err.message || 'Error al iniciar sesion'
      else errorDiv.textContent = err.message || 'Error al iniciar sesion'
      errorDiv.classList.remove('hidden')

      // Show resend option if email not verified
      if (err.data && err.data.code === 'EMAIL_NOT_VERIFIED' && resendDiv) {
        resendDiv.classList.remove('hidden')
        setupResendButton(resendDiv, email)
      }

      submitBtn.disabled = false
      submitBtn.textContent = 'Iniciar Sesion'
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
    newBtn.textContent = 'Enviando...'
    try {
      await apiFetch('/api/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      if (resendMsg) {
        resendMsg.textContent = 'Correo de verificacion reenviado. Revisa tu bandeja de entrada.'
        resendMsg.classList.remove('hidden')
      }
      newBtn.textContent = 'Correo enviado'
    } catch (err) {
      if (resendMsg) {
        resendMsg.textContent = err.message || 'Error al reenviar el correo'
        resendMsg.classList.remove('hidden')
      }
      newBtn.disabled = false
      newBtn.textContent = 'Reenviar correo de verificacion'
    }
  })
}
