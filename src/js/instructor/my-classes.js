import { requireInstructor } from '../auth.js'
import { apiFetch } from '../api.js'

let myClasses = []

export async function initInstructorClasses() {
  const user = await requireInstructor()
  if (!user) return

  await loadMyClasses()

  // Modal
  const overlay = document.getElementById('classModalOverlay')
  if (overlay) overlay.addEventListener('click', closeModal)
  const cancelBtn = document.getElementById('cancelClassBtn')
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  // Form
  const form = document.getElementById('classForm')
  if (form) form.addEventListener('submit', saveClass)

  // Cards event delegation
  const container = document.getElementById('classesContainer')
  if (container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const action = btn.dataset.action
      const id = parseInt(btn.dataset.id)
      if (action === 'edit') openEditModal(id)
      if (action === 'toggle') toggleActive(id)
    })
  }
}

async function loadMyClasses() {
  const container = document.getElementById('classesContainer')
  const loading = document.getElementById('classesLoading')
  if (!container) return

  if (loading) loading.classList.remove('hidden')
  container.classList.add('hidden')

  try {
    const data = await apiFetch('/api/activities/instructor/my-classes')
    myClasses = data.data || []
    if (loading) loading.classList.add('hidden')
    renderClasses(container)
    container.classList.remove('hidden')
  } catch (err) {
    if (loading) loading.classList.add('hidden')
    container.innerHTML = `<p class="text-center text-red-500 text-sm py-8">Error al cargar clases: ${escapeHtml(err.message)}</p>`
    container.classList.remove('hidden')
  }
}

function renderClasses(container) {
  if (myClasses.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <span class="material-symbols-outlined text-4xl">event_busy</span>
        <p class="text-sm mt-2">No tienes clases asignadas</p>
        <p class="text-xs mt-1">Contacta al administrador para que te asigne clases</p>
      </div>`
    return
  }

  container.innerHTML = myClasses.map(activity => `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
      <div class="text-3xl flex-shrink-0">${activity.icon || '🧘'}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <h3 class="font-bold text-primary-dark">${escapeHtml(activity.name)}</h3>
          ${activity.active
            ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Activa</span>'
            : '<span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">Inactiva</span>'}
        </div>
        <p class="text-sm text-slate-500">${escapeHtml(activity.schedule || 'Sin horario')}</p>
        <p class="text-xs text-slate-400 mt-1">${escapeHtml(activity.location || 'Sin ubicacion')} | ${activity.duration || '--'} min | ${getDifficultyLabel(activity.difficulty_level)}</p>
        ${activity.description ? `<p class="text-xs text-slate-500 mt-2 line-clamp-2">${escapeHtml(activity.description)}</p>` : ''}
      </div>
      <div class="flex gap-1 flex-shrink-0">
        <button data-action="toggle" data-id="${activity.id}" class="p-2 rounded-xl hover:bg-slate-50 ${activity.active ? 'text-green-600' : 'text-slate-400'}" title="${activity.active ? 'Desactivar' : 'Activar'}">
          <span class="material-symbols-outlined text-sm">${activity.active ? 'toggle_on' : 'toggle_off'}</span>
        </button>
        <button data-action="edit" data-id="${activity.id}" class="p-2 rounded-xl hover:bg-slate-50 text-primary" title="Editar">
          <span class="material-symbols-outlined text-sm">edit</span>
        </button>
      </div>
    </div>
  `).join('')
}

function getDifficultyLabel(level) {
  const labels = {
    all: 'Todos los niveles',
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado'
  }
  return labels[level] || level || 'Todos los niveles'
}

async function openEditModal(id) {
  const modal = document.getElementById('classModal')
  const activity = myClasses.find(a => a.id === id)

  if (!activity) {
    alert('Clase no encontrada')
    return
  }

  document.getElementById('classId').value = activity.id
  document.getElementById('className').value = activity.name || ''
  document.getElementById('classNameEn').value = activity.name_en || ''
  document.getElementById('classDescription').value = activity.description || ''
  document.getElementById('classDescriptionEn').value = activity.description_en || ''
  document.getElementById('classSchedule').value = activity.schedule || ''
  document.getElementById('classDuration').value = activity.duration || ''
  document.getElementById('classDifficulty').value = activity.difficulty_level || 'all'
  document.getElementById('classActive').checked = !!activity.active

  hideFormError()
  if (modal) modal.classList.remove('hidden')
}

async function saveClass(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveClassBtn')
  saveBtn.disabled = true
  saveBtn.textContent = 'Guardando...'
  hideFormError()

  const id = document.getElementById('classId').value
  const body = {
    name: document.getElementById('className').value.trim(),
    description: document.getElementById('classDescription').value.trim(),
    schedule: document.getElementById('classSchedule').value.trim(),
    duration: document.getElementById('classDuration').value || null,
    difficulty_level: document.getElementById('classDifficulty').value,
    active: document.getElementById('classActive').checked,
    name_en: document.getElementById('classNameEn').value.trim() || null,
    description_en: document.getElementById('classDescriptionEn').value.trim() || null
  }

  try {
    await apiFetch(`/api/activities/instructor/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })

    closeModal()
    await loadMyClasses()
  } catch (err) {
    showFormError(err.message || 'Error al guardar clase')
  }

  saveBtn.disabled = false
  saveBtn.textContent = 'Guardar'
}

async function toggleActive(id) {
  const activity = myClasses.find(a => a.id === id)
  if (!activity) return

  try {
    await apiFetch(`/api/activities/instructor/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !activity.active })
    })
    await loadMyClasses()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

function closeModal() {
  const modal = document.getElementById('classModal')
  if (modal) modal.classList.add('hidden')
}

function showFormError(msg) {
  const el = document.getElementById('classFormError')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function hideFormError() {
  const el = document.getElementById('classFormError')
  if (el) el.classList.add('hidden')
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
