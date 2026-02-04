export function initVerifyEmail() {
  const params = new URLSearchParams(window.location.search)
  const status = params.get('status')
  const reason = params.get('reason')

  const loading = document.getElementById('verifyLoading')
  const success = document.getElementById('verifySuccess')
  const error = document.getElementById('verifyError')
  const errorMsg = document.getElementById('verifyErrorMessage')

  if (!loading) return

  loading.classList.add('hidden')

  if (status === 'success') {
    success.classList.remove('hidden')
  } else {
    error.classList.remove('hidden')
    const messages = {
      'INVALID_TOKEN': 'El enlace de verificacion no es valido. Es posible que ya hayas verificado tu cuenta.',
      'TOKEN_EXPIRED': 'El enlace de verificacion ha expirado. Solicita uno nuevo desde la pagina de inicio de sesion.'
    }
    errorMsg.textContent = messages[reason] || 'Ocurrio un error al verificar tu cuenta. Intenta de nuevo.'
  }
}
