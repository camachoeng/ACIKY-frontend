import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

export async function initCleanup() {
  const user = await requireAdmin()
  if (!user) return

  await loadStats()

  // Button events
  document.getElementById('runCleanupBtn')?.addEventListener('click', runCleanup)
  document.getElementById('refreshStatsBtn')?.addEventListener('click', loadStats)
  document.getElementById('retryStatsBtn')?.addEventListener('click', loadStats)
}

async function loadStats() {
  const loading = document.getElementById('statsLoading')
  const container = document.getElementById('statsContainer')
  const error = document.getElementById('statsError')

  loading?.classList.remove('hidden')
  container?.classList.add('hidden')
  error?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/cleanup/stats')

    if (data.success && data.data) {
      const stats = data.data

      // Update stat cards
      document.getElementById('temporaryCount').textContent = stats.temporaryCount || 0
      document.getElementById('permanentCount').textContent = stats.permanentCount || 0
      document.getElementById('totalCount').textContent = stats.totalCount || 0

      loading?.classList.add('hidden')
      container?.classList.remove('hidden')
    } else {
      throw new Error('Invalid response format')
    }
  } catch (err) {
    console.error('Error loading stats:', err)
    loading?.classList.add('hidden')
    error?.classList.remove('hidden')
    const errorMsg = document.getElementById('statsErrorMessage')
    if (errorMsg) {
      errorMsg.textContent = t('errors.loadError') + ': ' + err.message
    }
  }
}

async function runCleanup() {
  const btn = document.getElementById('runCleanupBtn')
  const hoursSelect = document.getElementById('hoursSelect')
  const resultDiv = document.getElementById('cleanupResult')
  const resultContent = document.getElementById('cleanupResultContent')

  if (!btn || !hoursSelect) return

  const hours = parseInt(hoursSelect.value)
  const originalText = btn.innerHTML

  // Confirm action
  const confirmed = confirm(
    t('actions.confirmCleanup') ||
    `¿Estás seguro de eliminar archivos temporales subidos hace más de ${hours} horas?`
  )

  if (!confirmed) return

  btn.disabled = true
  btn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span> <span>${t('actions.cleaning') || 'Limpiando...'}</span>`

  resultDiv?.classList.add('hidden')

  try {
    const data = await apiFetch(`/api/cleanup/temporary-uploads?hoursOld=${hours}`, {
      method: 'POST'
    })

    if (data.success) {
      const result = data.data || {}

      // Show results
      if (resultContent) {
        resultContent.innerHTML = `
          <div class="p-4 bg-green-50 border border-green-200 rounded-xl">
            <div class="flex items-start gap-3">
              <span class="material-symbols-outlined text-green-600 flex-shrink-0">check_circle</span>
              <div class="text-sm">
                <p class="font-semibold text-green-800 mb-2">${t('result.success') || '✅ Limpieza completada exitosamente'}</p>
                <ul class="space-y-1 text-green-700">
                  <li><strong>${t('result.deletedCount') || 'Archivos eliminados'}:</strong> ${result.deletedCount || 0}</li>
                  <li><strong>${t('result.threshold') || 'Umbral aplicado'}:</strong> ${result.threshold || '-'}</li>
                  ${result.deletedFiles && result.deletedFiles.length > 0 ? `
                    <li class="mt-2">
                      <strong>${t('result.deletedFiles') || 'Archivos eliminados'}:</strong>
                      <ul class="ml-4 mt-1 space-y-1 text-xs">
                        ${result.deletedFiles.map(file => `<li>• ${escapeHtml(file)}</li>`).join('')}
                      </ul>
                    </li>
                  ` : ''}
                </ul>
              </div>
            </div>
          </div>
        `
      }

      resultDiv?.classList.remove('hidden')

      // Reload stats after cleanup
      setTimeout(() => loadStats(), 1000)
    } else {
      throw new Error(data.message || 'Cleanup failed')
    }
  } catch (err) {
    console.error('Cleanup error:', err)

    if (resultContent) {
      resultContent.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-red-600 flex-shrink-0">error</span>
            <div class="text-sm">
              <p class="font-semibold text-red-800 mb-1">${t('result.error') || '❌ Error en la limpieza'}</p>
              <p class="text-red-700">${escapeHtml(err.message)}</p>
            </div>
          </div>
        </div>
      `
    }

    resultDiv?.classList.remove('hidden')
  } finally {
    btn.disabled = false
    btn.innerHTML = originalText
  }
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
