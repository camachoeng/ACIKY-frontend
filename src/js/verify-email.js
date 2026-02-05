import { t } from './i18n.js'

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
    const errorKey = `error.${reason}`
    const translated = t(errorKey)
    errorMsg.textContent = translated !== errorKey ? translated : t('error.default')
  }
}
