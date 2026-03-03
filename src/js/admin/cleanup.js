import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

let lastAnalysisData = null

export async function initCleanup() {
  const user = await requireAdmin()
  if (!user) return

  document.getElementById('analyzeBtn')?.addEventListener('click', runAnalysis)
  document.getElementById('deleteBtn')?.addEventListener('click', runDelete)
  document.getElementById('reanalyzeBtn')?.addEventListener('click', runAnalysis)
  document.getElementById('reanalyzeBtnClean')?.addEventListener('click', runAnalysis)
  document.getElementById('retryBtn')?.addEventListener('click', runAnalysis)
}

async function runAnalysis() {
  const analyzeBtn = document.getElementById('analyzeBtn')
  const analysisResults = document.getElementById('analysisResults')
  const analyzeError = document.getElementById('analyzeError')
  const cleanupResult = document.getElementById('cleanupResult')

  analyzeError?.classList.add('hidden')
  cleanupResult?.classList.add('hidden')

  if (analyzeBtn) {
    analyzeBtn.disabled = true
    analyzeBtn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span> <span>${t('analysis.analyzing') || 'Analizando...'}</span>`
  }

  try {
    const data = await apiFetch('/api/cleanup/orphaned')

    if (!data.success || !data.data) throw new Error(data.message || 'Invalid response')

    const { cloudinaryTotal, dbTotal, orphanedCount, orphaned, environment } = data.data
    lastAnalysisData = data.data

    // Show env badge
    const envBadge = document.getElementById('envBadge')
    if (envBadge && environment) {
      const isProd = environment === 'production'
      envBadge.textContent = environment
      envBadge.className = `inline-block px-2 py-0.5 rounded-full text-xs font-bold ${isProd ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`
      envBadge.classList.remove('hidden')
    }

    // Update stat chips
    document.getElementById('cloudinaryCount').textContent = cloudinaryTotal
    document.getElementById('dbCount').textContent = dbTotal
    document.getElementById('orphanedCount').textContent = orphanedCount

    // Show/hide sections based on orphan count
    const noOrphansMsg = document.getElementById('noOrphansMsg')
    const orphanList = document.getElementById('orphanList')
    const deleteSection = document.getElementById('deleteSection')
    const reanalyzeSection = document.getElementById('reanalyzeSection')

    if (orphanedCount === 0) {
      noOrphansMsg?.classList.remove('hidden')
      orphanList?.classList.add('hidden')
      deleteSection?.classList.add('hidden')
      reanalyzeSection?.classList.remove('hidden')
    } else {
      noOrphansMsg?.classList.add('hidden')
      reanalyzeSection?.classList.add('hidden')
      deleteSection?.classList.remove('hidden')
      orphanList?.classList.remove('hidden')

      // Render orphan list
      const orphanItems = document.getElementById('orphanItems')
      if (orphanItems && orphaned) {
        orphanItems.innerHTML = orphaned
          .map(item => `<p class="text-xs font-mono text-slate-600 py-0.5">• ${escapeHtml(item.publicId)}</p>`)
          .join('')
      }
    }

    analysisResults?.classList.remove('hidden')

  } catch (err) {
    analyzeError?.classList.remove('hidden')
    const msg = document.getElementById('analyzeErrorMessage')
    if (msg) msg.textContent = err.message
  } finally {
    if (analyzeBtn) {
      analyzeBtn.disabled = false
      analyzeBtn.innerHTML = `<span class="material-symbols-outlined text-sm">search</span> <span>${t('analysis.analyzeButton') || 'Analizar imágenes'}</span>`
    }
  }
}

async function runDelete() {
  if (!lastAnalysisData) return

  const count = lastAnalysisData.orphanedCount
  const confirmMsg = (t('analysis.confirmDelete') || '¿Eliminar {count} imágenes huérfanas de Cloudinary? Esta acción no se puede deshacer.')
    .replace('{count}', count)

  if (!confirm(confirmMsg)) return

  const deleteBtn = document.getElementById('deleteBtn')
  const reanalyzeBtn = document.getElementById('reanalyzeBtn')
  const cleanupResult = document.getElementById('cleanupResult')
  const cleanupResultContent = document.getElementById('cleanupResultContent')

  if (deleteBtn) {
    deleteBtn.disabled = true
    deleteBtn.innerHTML = `<span class="material-symbols-outlined text-sm animate-spin">progress_activity</span> <span>${t('analysis.deleting') || 'Eliminando...'}</span>`
  }
  if (reanalyzeBtn) reanalyzeBtn.disabled = true

  cleanupResult?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/cleanup/orphaned', { method: 'POST' })

    if (!data.success) throw new Error(data.message || 'Deletion failed')

    const result = data.data || {}

    if (cleanupResultContent) {
      cleanupResultContent.innerHTML = `
        <div class="p-4 bg-green-50 border border-green-200 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-green-600 flex-shrink-0">check_circle</span>
            <div class="text-sm">
              <p class="font-semibold text-green-800 mb-2">${escapeHtml(t('result.success') || 'Limpieza completada exitosamente')}</p>
              <p class="text-green-700"><strong>${escapeHtml(t('result.deletedCount') || 'Imágenes eliminadas')}:</strong> ${result.deletedCount ?? 0}</p>
              ${result.failed > 0 ? `<p class="text-amber-700 mt-1">Errores: ${result.failed}</p>` : ''}
            </div>
          </div>
        </div>
      `
    }
    cleanupResult?.classList.remove('hidden')

    // Re-run analysis to update counts
    lastAnalysisData = null
    setTimeout(() => runAnalysis(), 800)

  } catch (err) {
    if (cleanupResultContent) {
      cleanupResultContent.innerHTML = `
        <div class="p-4 bg-red-50 border border-red-200 rounded-xl">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-red-600 flex-shrink-0">error</span>
            <div class="text-sm">
              <p class="font-semibold text-red-800 mb-1">${escapeHtml(t('result.error') || 'Error en la limpieza')}</p>
              <p class="text-red-700">${escapeHtml(err.message)}</p>
            </div>
          </div>
        </div>
      `
    }
    cleanupResult?.classList.remove('hidden')
  } finally {
    if (deleteBtn) {
      deleteBtn.disabled = false
      deleteBtn.innerHTML = `<span class="material-symbols-outlined text-sm">delete_sweep</span> <span>${t('analysis.deleteButton') || 'Eliminar huérfanas'}</span>`
    }
    if (reanalyzeBtn) reanalyzeBtn.disabled = false
  }
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
