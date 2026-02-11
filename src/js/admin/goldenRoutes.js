import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

let allRoutes = []

const STATUS_STYLES = {
  active: { bg: 'bg-green-100', text: 'text-green-700', icon: 'check_circle' },
  planning: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'pending' }
}

export async function initAdminGoldenRoutes() {
  const user = await requireAdmin()
  if (!user) return

  await loadRoutes()

  document.getElementById('createRouteBtn')
    ?.addEventListener('click', openCreateModal)

  document.getElementById('routeModalOverlay')
    ?.addEventListener('click', closeModal)

  document.getElementById('cancelRouteBtn')
    ?.addEventListener('click', closeModal)

  document.getElementById('routeForm')
    ?.addEventListener('submit', saveRoute)

  const container = document.getElementById('routesContainer')
  container?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const { action, id } = btn.dataset
    const routeId = parseInt(id)
    if (action === 'edit') openEditModal(routeId)
    if (action === 'delete') confirmDelete(routeId)
  })

  window.addEventListener('languageChanged', () => {
    const container = document.getElementById('routesContainer')
    if (container && allRoutes.length > 0) {
      renderRoutes(container)
    }
  })
}

async function loadRoutes() {
  const container = document.getElementById('routesContainer')
  const loading = document.getElementById('routesLoading')
  const empty = document.getElementById('routesEmpty')

  loading?.classList.remove('hidden')
  container?.classList.add('hidden')
  empty?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/routes')
    allRoutes = data.data || []

    loading?.classList.add('hidden')

    if (allRoutes.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderRoutes(container)
    }
  } catch (err) {
    loading?.classList.add('hidden')
    if (container) {
      container.classList.remove('hidden')
      container.innerHTML = `
        <div class="text-center py-8 text-red-500 text-sm">
          ${t('errors.loadError')}: ${escapeHtml(err.message)}
        </div>`
    }
  }
}

function renderRoutes(container) {
  container.innerHTML = allRoutes.map(item => {
    const status = STATUS_STYLES[item.status] || STATUS_STYLES.planning
    const statusLabel = item.status === 'active' ? t('status.active') : t('status.planning')

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-primary-dark">${escapeHtml(item.name || '')}</h3>
            <div class="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <span class="material-symbols-outlined text-xs">location_on</span>
              <span>${escapeHtml(item.origin || '')}</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
              <span>${escapeHtml(item.destination || '')}</span>
            </div>
            <div class="flex flex-wrap gap-3 text-xs text-slate-400 mt-2">
              ${item.participants_count ? `<span>${item.participants_count} ${escapeHtml(t('card.participants'))}</span>` : ''}
              ${item.spaces_established ? `<span>${item.spaces_established} ${escapeHtml(t('card.spaces'))}</span>` : ''}
              ${item.frequency ? `<span>${escapeHtml(t('card.frequency'))}: ${escapeHtml(item.frequency)}</span>` : ''}
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="px-2 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text} flex items-center gap-1">
              <span class="material-symbols-outlined text-sm">${status.icon}</span>
              ${escapeHtml(statusLabel)}
            </span>
            <button data-action="edit" data-id="${item.id}" class="p-1 text-primary hover:text-primary-dark transition-colors">
              <span class="material-symbols-outlined text-sm">edit</span>
            </button>
            <button data-action="delete" data-id="${item.id}" class="p-1 text-accent-terracotta hover:text-red-600 transition-colors">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>`
  }).join('')
}

function openCreateModal() {
  document.getElementById('routeModalTitle').setAttribute('data-i18n', 'modal.newTitle')
  document.getElementById('routeModalTitle').textContent = t('modal.newTitle')
  document.getElementById('routeId').value = ''
  document.getElementById('routeName').value = ''
  document.getElementById('routeNameEn').value = ''
  document.getElementById('routeOrigin').value = ''
  document.getElementById('routeDestination').value = ''
  document.getElementById('routeDescription').value = ''
  document.getElementById('routeDescriptionEn').value = ''
  document.getElementById('routeFrequency').value = ''
  document.getElementById('routeStatus').value = 'active'
  document.getElementById('routeParticipants').value = '0'
  document.getElementById('routeSpaces').value = '0'
  hideFormError()
  document.getElementById('routeModal')?.classList.remove('hidden')
}

function openEditModal(id) {
  const item = allRoutes.find(r => r.id === id)
  if (!item) return

  document.getElementById('routeModalTitle').setAttribute('data-i18n', 'modal.editTitle')
  document.getElementById('routeModalTitle').textContent = t('modal.editTitle')
  document.getElementById('routeId').value = item.id
  document.getElementById('routeName').value = item.name || ''
  document.getElementById('routeNameEn').value = item.name_en || ''
  document.getElementById('routeOrigin').value = item.origin || ''
  document.getElementById('routeDestination').value = item.destination || ''
  document.getElementById('routeDescription').value = item.description || ''
  document.getElementById('routeDescriptionEn').value = item.description_en || ''
  document.getElementById('routeFrequency').value = item.frequency || ''
  document.getElementById('routeStatus').value = item.status || 'active'
  document.getElementById('routeParticipants').value = item.participants_count || 0
  document.getElementById('routeSpaces').value = item.spaces_established || 0
  hideFormError()
  document.getElementById('routeModal')?.classList.remove('hidden')
}

async function saveRoute(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveRouteBtn')
  const originalText = saveBtn.textContent
  saveBtn.disabled = true
  saveBtn.textContent = t('modal.saving')
  hideFormError()

  const id = document.getElementById('routeId').value
  const body = {
    name: document.getElementById('routeName').value.trim(),
    name_en: document.getElementById('routeNameEn').value.trim() || null,
    origin: document.getElementById('routeOrigin').value.trim(),
    destination: document.getElementById('routeDestination').value.trim(),
    description: document.getElementById('routeDescription').value.trim() || null,
    description_en: document.getElementById('routeDescriptionEn').value.trim() || null,
    frequency: document.getElementById('routeFrequency').value.trim() || null,
    status: document.getElementById('routeStatus').value,
    participants_count: parseInt(document.getElementById('routeParticipants').value) || 0,
    spaces_established: parseInt(document.getElementById('routeSpaces').value) || 0
  }

  try {
    if (id) {
      await apiFetch(`/api/routes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      })
    } else {
      await apiFetch('/api/routes', {
        method: 'POST',
        body: JSON.stringify(body)
      })
    }

    closeModal()
    await loadRoutes()
  } catch (err) {
    showFormError(err.message || t('errors.saveError'))
  }

  saveBtn.disabled = false
  saveBtn.textContent = originalText
}

async function confirmDelete(id) {
  const item = allRoutes.find(r => r.id === id)
  if (!item) return

  if (!confirm(t('confirm.delete', { name: item.name }))) return

  try {
    await apiFetch(`/api/routes/${id}`, { method: 'DELETE' })
    await loadRoutes()
  } catch (err) {
    alert(t('errors.deleteError') + ': ' + err.message)
  }
}

function closeModal() {
  document.getElementById('routeModal')?.classList.add('hidden')
}

function showFormError(msg) {
  const el = document.getElementById('routeFormError')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function hideFormError() {
  const el = document.getElementById('routeFormError')
  if (el) el.classList.add('hidden')
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
