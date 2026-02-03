import { apiFetch } from './api.js'

export function initRegister() {
  const form = document.getElementById('registerForm')
  const errorDiv = document.getElementById('registerError')
  const submitBtn = document.getElementById('registerBtn')

  if (!form) return

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    errorDiv.classList.add('hidden')

    const username = form.username.value.trim()
    const email = form.email.value.trim()
    const password = form.password.value
    const confirmPassword = form.confirmPassword.value

    // Client-side validation
    if (password !== confirmPassword) {
      const errorSpan = errorDiv.querySelector('span:last-child')
      if (errorSpan) errorSpan.textContent = 'Las contrasenas no coinciden'
      else errorDiv.textContent = 'Las contrasenas no coinciden'
      errorDiv.classList.remove('hidden')
      return
    }

    submitBtn.disabled = true
    submitBtn.textContent = 'Registrando...'

    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password })
      })

      window.location.href = '/pages/login.html?registered=true'
    } catch (err) {
      const errorSpan = errorDiv.querySelector('span:last-child')
      if (errorSpan) errorSpan.textContent = err.message || 'Error al registrarse'
      else errorDiv.textContent = err.message || 'Error al registrarse'
      errorDiv.classList.remove('hidden')
      submitBtn.disabled = false
      submitBtn.textContent = 'Registrarse'
    }
  })
}
