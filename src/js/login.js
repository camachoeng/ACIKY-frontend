import { apiFetch } from './api.js'

export function initLogin() {
  const form = document.getElementById('loginForm')
  const errorDiv = document.getElementById('loginError')
  const submitBtn = document.getElementById('loginBtn')
  const successDiv = document.getElementById('loginSuccess')

  if (!form) return

  // Show success message if redirected from register
  if (window.location.search.includes('registered=true') && successDiv) {
    successDiv.classList.remove('hidden')
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorDiv.classList.add('hidden')
    if (successDiv) successDiv.classList.add('hidden')
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
      submitBtn.disabled = false
      submitBtn.textContent = 'Iniciar Sesion'
    }
  })
}
