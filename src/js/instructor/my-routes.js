import { requireInstructor } from '../auth.js'
import { apiFetch } from '../api.js'

let myRoutes = []

export async function initInstructorRoutes() {
  const user = await requireInstructor()
  if (!user) return

  await loadMyRoutes()

  // Modal
  const overlay = document.getElementById('routeModalOverlay')
  if (overlay) overlay.addEventListener('click', closeModal)
  const cancelBtn = document.getElementById('cancelRouteBtn')
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  // Form
  const form = document.getElementById('routeForm')
  if (form) form.addEventListener('submit', saveRoute)

  // Cards event delegation
  const container = document.getElementById('routesContainer')
  if (container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const action = btn.dataset.action
      const id = parseInt(btn.dataset.id)
      if (action === 'edit') openEditModal(id)
    })
  }
}

async function loadMyRoutes() {
  const container = document.getElementById('routesContainer')
  const loading = document.getElementById('routesLoading')
  if (!container) return

  if (loading) loading.classList.remove('hidden')
  container.classList.add('hidden')

  try {
    const data = await apiFetch('/api/routes/instructor/my-routes')
    myRoutes = data.data || []
    if (loading) loading.classList.add('hidden')
    renderRoutes(container)
    container.classList.remove('hidden')
  } catch (err) {
    if (loading) loading.classList.add('hidden')
    container.innerHTML = `<p class="text-center text-red-500 text-sm py-8">Error al cargar rutas: ${escapeHtml(err.message)}</p>`
    container.classList.remove('hidden')
  }
}

function renderRoutes(container) {
  if (myRoutes.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <span class="material-symbols-outlined text-4xl">route</span>
        <p class="text-sm mt-2">No tienes rutas asignadas</p>
        <p class="text-xs mt-1">Contacta al administrador para que te asigne rutas</p>
      </div>`
    return
  }

  container.innerHTML = myRoutes.map(route => `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-xl">route</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h3 class="font-bold text-primary-dark">${escapeHtml(route.name)}</h3>
            ${route.status === 'active'
              ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Activa</span>'
              : '<span class="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">En planificación</span>'}
          </div>
          <div class="flex items-center gap-1 text-xs text-slate-500 mb-2">
            <span class="material-symbols-outlined text-xs">location_on</span>
            <span>${escapeHtml(route.origin || '')}</span>
            <span class="material-symbols-outlined text-xs">arrow_forward</span>
            <span>${escapeHtml(route.destination || '')}</span>
          </div>
          ${route.start_date || route.end_date ? `
          <p class="text-xs text-slate-400 mb-2">
            ${route.start_date ? formatDate(route.start_date) : '---'} → ${route.end_date ? formatDate(route.end_date) : '---'}
          </p>` : ''}
          <div class="flex gap-3 text-xs text-slate-400">
            ${route.participants_count ? `<span>${route.participants_count}+ participantes</span>` : ''}
            ${route.spaces_established ? `<span>${route.spaces_established} espacios</span>` : ''}
          </div>
        </div>
        <div class="flex-shrink-0">
          <button data-action="edit" data-id="${route.id}" class="p-2 rounded-xl hover:bg-slate-50 text-primary" title="Editar">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
      </div>
    </div>
  `).join('')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  // Split the date string to avoid timezone issues
  const datePart = dateStr.split('T')[0]
  const [year, month, day] = datePart.split('-')
  // Create date in local timezone
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

async function openEditModal(id) {
  const modal = document.getElementById('routeModal')
  const route = myRoutes.find(r => r.id === id)

  if (!route) {
    alert('Ruta no encontrada')
    return
  }

  document.getElementById('routeId').value = route.id
  document.getElementById('routeStartDate').value = route.start_date ? route.start_date.split('T')[0] : ''
  document.getElementById('routeEndDate').value = route.end_date ? route.end_date.split('T')[0] : ''
  document.getElementById('routeStatus').value = route.status || 'active'
  document.getElementById('routeParticipants').value = route.participants_count || 0
  document.getElementById('routeSpaces').value = route.spaces_established || 0

  hideFormError()
  if (modal) modal.classList.remove('hidden')
}

async function saveRoute(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveRouteBtn')
  saveBtn.disabled = true
  saveBtn.textContent = 'Guardando...'
  hideFormError()

  const id = document.getElementById('routeId').value
  const startDate = document.getElementById('routeStartDate').value
  const endDate = document.getElementById('routeEndDate').value

  const body = {
    start_date: startDate || null,
    end_date: endDate || null,
    status: document.getElementById('routeStatus').value,
    participants_count: parseInt(document.getElementById('routeParticipants').value) || 0,
    spaces_established: parseInt(document.getElementById('routeSpaces').value) || 0
  }

  try {
    await apiFetch(`/api/routes/instructor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })

    closeModal()
    await loadMyRoutes()
  } catch (err) {
    showFormError(err.message || 'Error al guardar ruta')
  }

  saveBtn.disabled = false
  saveBtn.textContent = 'Guardar'
}

function closeModal() {
  const modal = document.getElementById('routeModal')
  if (modal) modal.classList.add('hidden')
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
