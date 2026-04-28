import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { formatUserName } from '../utils/formatUserName.js'

let activities = []
let instructors = []
let instructorOrderedIds = []

export async function initAdminSchedule() {
  const user = await requireAdmin()
  if (!user) return

  await Promise.all([loadActivities(), loadInstructors()])

  // Create button
  const createBtn = document.getElementById('createActivityBtn')
  if (createBtn) createBtn.addEventListener('click', openCreateModal)

  // Modal
  const overlay = document.getElementById('activityModalOverlay')
  if (overlay) overlay.addEventListener('click', closeModal)
  const cancelBtn = document.getElementById('cancelActivityBtn')
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  // Form
  const form = document.getElementById('activityForm')
  if (form) form.addEventListener('submit', saveActivity)

  setupImageUpload()

  // Cards event delegation
  const container = document.getElementById('activitiesContainer')
  if (container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const action = btn.dataset.action
      const id = parseInt(btn.dataset.id)
      if (action === 'edit') openEditModal(id)
      if (action === 'delete') confirmDelete(id)
      if (action === 'toggle') toggleActive(id)
    })
  }
}

async function loadInstructors() {
  try {
    const data = await apiFetch('/api/users/instructors')
    instructors = data.data || []
    populateInstructorCheckboxes()
  } catch (err) {
    console.error('Error loading instructors:', err)
  }
}

function populateInstructorCheckboxes(selectedIds = []) {
  const container = document.getElementById('activityInstructorList')
  if (!container) return

  if (instructors.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400">No hay instructores disponibles</p>'
    return
  }

  container.innerHTML = instructors.map(i => {
    const isChecked = selectedIds.includes(i.id)
    return `
      <label class="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
        <input type="checkbox"
               name="activityInstructorIds"
               value="${i.id}"
               ${isChecked ? 'checked' : ''}
               class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
        <span class="text-sm text-slate-700">${escapeHtml(formatUserName(i))}</span>
      </label>`
  }).join('')

  updateInstructorOrderList(selectedIds)

  container.querySelectorAll('input[name="activityInstructorIds"]').forEach(cb => {
    cb.addEventListener('change', () => updateInstructorOrderList())
  })
}

function updateInstructorOrderList(initialOrder = null) {
  const section = document.getElementById('activityInstructorOrderSection')
  const list = document.getElementById('activityInstructorOrderList')
  if (!section || !list) return

  const checkedIds = Array.from(
    document.querySelectorAll('input[name="activityInstructorIds"]:checked')
  ).map(cb => parseInt(cb.value))

  if (checkedIds.length < 2) {
    section.classList.add('hidden')
    instructorOrderedIds = checkedIds
    return
  }

  if (initialOrder !== null) {
    instructorOrderedIds = [
      ...initialOrder.filter(id => checkedIds.includes(id)),
      ...checkedIds.filter(id => !initialOrder.includes(id))
    ]
  } else {
    instructorOrderedIds = [
      ...instructorOrderedIds.filter(id => checkedIds.includes(id)),
      ...checkedIds.filter(id => !instructorOrderedIds.includes(id))
    ]
  }

  section.classList.remove('hidden')
  renderInstructorOrderList(list)
}

function renderInstructorOrderList(list) {
  list.innerHTML = instructorOrderedIds.map((id, index) => {
    const instructor = instructors.find(i => i.id === id)
    if (!instructor) return ''
    const isFirst = index === 0
    const isLast = index === instructorOrderedIds.length - 1
    return `
      <div class="flex items-center gap-2 bg-white rounded-xl p-2 border border-slate-100">
        <span class="text-xs font-bold text-slate-400 w-4 shrink-0">${index + 1}</span>
        <span class="flex-1 text-sm text-slate-700 truncate">${escapeHtml(formatUserName(instructor))}</span>
        <button type="button" data-order-action="up" data-id="${id}"
                class="p-1 rounded-lg transition-colors ${isFirst ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-primary'}"
                ${isFirst ? 'disabled' : ''}>
          <span class="material-symbols-outlined text-sm">arrow_upward</span>
        </button>
        <button type="button" data-order-action="down" data-id="${id}"
                class="p-1 rounded-lg transition-colors ${isLast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-primary'}"
                ${isLast ? 'disabled' : ''}>
          <span class="material-symbols-outlined text-sm">arrow_downward</span>
        </button>
      </div>`
  }).join('')

  list.addEventListener('click', handleOrderListClick, { once: true })
}

function handleOrderListClick(e) {
  const list = document.getElementById('activityInstructorOrderList')
  if (!list) return
  list.addEventListener('click', handleOrderListClick, { once: true })

  const btn = e.target.closest('[data-order-action]')
  if (!btn) return
  const { orderAction, id } = btn.dataset
  const idx = instructorOrderedIds.indexOf(parseInt(id))

  if (orderAction === 'up' && idx > 0) {
    ;[instructorOrderedIds[idx - 1], instructorOrderedIds[idx]] = [instructorOrderedIds[idx], instructorOrderedIds[idx - 1]]
    renderInstructorOrderList(list)
  } else if (orderAction === 'down' && idx < instructorOrderedIds.length - 1) {
    ;[instructorOrderedIds[idx], instructorOrderedIds[idx + 1]] = [instructorOrderedIds[idx + 1], instructorOrderedIds[idx]]
    renderInstructorOrderList(list)
  }
}

async function loadActivities() {
  const container = document.getElementById('activitiesContainer')
  const loading = document.getElementById('activitiesLoading')
  if (!container) return

  if (loading) loading.classList.remove('hidden')
  container.classList.add('hidden')

  try {
    const data = await apiFetch('/api/activities')
    activities = data.data || []
    if (loading) loading.classList.add('hidden')
    renderActivities(container)
    container.classList.remove('hidden')
  } catch (err) {
    if (loading) loading.classList.add('hidden')
    container.innerHTML = `<p class="text-center text-red-500 text-sm py-8">Error al cargar clases: ${escapeHtml(err.message)}</p>`
    container.classList.remove('hidden')
  }
}

function renderActivities(container) {
  if (activities.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <span class="material-symbols-outlined text-4xl">event_busy</span>
        <p class="text-sm mt-2">No hay clases creadas</p>
      </div>`
    return
  }

  container.innerHTML = activities.map(activity => `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
      ${activity.image_url
        ? `<div class="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0"><img src="${escapeHtml(activity.image_url)}" alt="${escapeHtml(activity.name)}" class="w-full h-full object-cover" /></div>`
        : `<div class="text-3xl flex-shrink-0">${activity.icon || '🧘'}</div>`}
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <h3 class="font-bold text-primary-dark">${escapeHtml(activity.name)}</h3>
          ${activity.active
            ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Activa</span>'
            : '<span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">Inactiva</span>'}
          ${activity.featured
            ? '<span class="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">Destacada</span>'
            : ''}
        </div>
        <p class="text-sm text-slate-500">${escapeHtml(activity.schedule || 'Sin horario')}</p>
        <p class="text-xs text-slate-400 mt-1">${escapeHtml(activity.location || 'Sin ubicacion')} | ${activity.duration || '--'} min | ${activity.instructors && activity.instructors.length > 0 ? activity.instructors.map(i => escapeHtml(formatUserName(i))).join(', ') : (activity.instructor_name ? escapeHtml(activity.instructor_name) : 'Sin instructor')}</p>
      </div>
      <div class="flex gap-1 flex-shrink-0">
        <button data-action="toggle" data-id="${activity.id}" class="p-2 rounded-xl hover:bg-slate-50 ${activity.active ? 'text-green-600' : 'text-slate-400'}" title="${activity.active ? 'Desactivar' : 'Activar'}">
          <span class="material-symbols-outlined text-sm">${activity.active ? 'toggle_on' : 'toggle_off'}</span>
        </button>
        <button data-action="edit" data-id="${activity.id}" class="p-2 rounded-xl hover:bg-slate-50 text-primary">
          <span class="material-symbols-outlined text-sm">edit</span>
        </button>
        <button data-action="delete" data-id="${activity.id}" class="p-2 rounded-xl hover:bg-slate-50 text-accent-terracotta">
          <span class="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  `).join('')
}

function openCreateModal() {
  const modal = document.getElementById('activityModal')
  const title = document.getElementById('activityModalTitle')
  const form = document.getElementById('activityForm')

  if (title) title.textContent = 'Nueva Clase'
  if (form) form.reset()
  document.getElementById('activityId').value = ''
  instructorOrderedIds = []
  populateInstructorCheckboxes()
  resetImageUpload()
  hideFormError()
  if (modal) modal.classList.remove('hidden')
}

async function openEditModal(id) {
  const modal = document.getElementById('activityModal')
  const title = document.getElementById('activityModalTitle')

  try {
    const data = await apiFetch(`/api/activities/${id}`)
    const a = data.data

    if (title) title.textContent = 'Editar Clase'
    document.getElementById('activityId').value = a.id
    document.getElementById('activityName').value = a.name || ''
    document.getElementById('activityDescription').value = a.description || ''
    document.getElementById('activitySchedule').value = a.schedule || ''
    document.getElementById('activityClassDate').value = a.class_date ? a.class_date.split('T')[0] : ''
    document.getElementById('activityClassTime').value = a.class_time ? a.class_time.substring(0, 5) : ''
    document.getElementById('activityDuration').value = a.duration || ''
    document.getElementById('activityLocation').value = a.location || ''
    const currentIds = (a.instructors || []).map(i => i.id)
    const selectedIds = currentIds.length === 0 && a.instructor_id ? [a.instructor_id] : currentIds
    instructorOrderedIds = []
    populateInstructorCheckboxes(selectedIds)
    document.getElementById('activityPrice').value = a.price || ''
    document.getElementById('activityMemberPrice').value = a.member_price || ''
    document.getElementById('activityIcon').value = a.icon || ''
    document.getElementById('activityDifficulty').value = a.difficulty_level || 'all'
    document.getElementById('activityActive').checked = !!a.active
    document.getElementById('activityFeatured').checked = !!a.featured
    document.getElementById('activityNameEn').value = a.name_en || ''
    document.getElementById('activityDescriptionEn').value = a.description_en || ''
    document.getElementById('activityLocationEn').value = a.location_en || ''

    document.getElementById('activityImageUrl').value = a.image_url || ''
    if (a.image_url) {
      document.getElementById('activityImagePreviewImg').src = a.image_url
      document.getElementById('activityImagePreview').classList.remove('hidden')
      document.getElementById('activityImageUploadZone').classList.add('hidden')
    } else {
      resetImageUpload()
    }

    hideFormError()
    if (modal) modal.classList.remove('hidden')
  } catch (err) {
    alert('Error al cargar clase: ' + err.message)
  }
}

async function saveActivity(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveActivityBtn')
  saveBtn.disabled = true
  saveBtn.textContent = 'Guardando...'
  hideFormError()

  const id = document.getElementById('activityId').value
  const classDate = document.getElementById('activityClassDate').value
  const classTime = document.getElementById('activityClassTime').value

  const body = {
    name: document.getElementById('activityName').value.trim(),
    description: document.getElementById('activityDescription').value.trim(),
    schedule: document.getElementById('activitySchedule').value.trim(),
    class_date: classDate || null,
    class_time: classTime || null,
    duration: document.getElementById('activityDuration').value || null,
    location: document.getElementById('activityLocation').value.trim(),
    instructor_ids: document.getElementById('activityInstructorOrderSection')?.classList.contains('hidden') === false
      ? [...instructorOrderedIds]
      : Array.from(document.querySelectorAll('input[name="activityInstructorIds"]:checked')).map(cb => parseInt(cb.value)),
    price: document.getElementById('activityPrice').value || null,
    member_price: document.getElementById('activityMemberPrice').value || null,
    icon: document.getElementById('activityIcon').value.trim(),
    difficulty_level: document.getElementById('activityDifficulty').value,
    active: document.getElementById('activityActive').checked,
    featured: document.getElementById('activityFeatured').checked,
    name_en: document.getElementById('activityNameEn').value.trim() || null,
    description_en: document.getElementById('activityDescriptionEn').value.trim() || null,
    location_en: document.getElementById('activityLocationEn').value.trim() || null,
    image_url: document.getElementById('activityImageUrl').value || null
  }

  try {
    if (id) {
      await apiFetch(`/api/activities/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      })
    } else {
      await apiFetch('/api/activities', {
        method: 'POST',
        body: JSON.stringify(body)
      })
    }

    closeModal()
    await loadActivities()
  } catch (err) {
    showFormError(err.message || 'Error al guardar clase')
  }

  saveBtn.disabled = false
  saveBtn.textContent = 'Guardar'
}

async function toggleActive(id) {
  const activity = activities.find(a => a.id === id)
  if (!activity) return

  try {
    await apiFetch(`/api/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !activity.active })
    })
    await loadActivities()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

async function confirmDelete(id) {
  const activity = activities.find(a => a.id === id)
  if (!activity) return

  if (!confirm(`Eliminar clase "${activity.name}"?`)) return

  try {
    await apiFetch(`/api/activities/${id}`, { method: 'DELETE' })
    await loadActivities()
  } catch (err) {
    alert('Error al eliminar: ' + err.message)
  }
}

function closeModal() {
  const modal = document.getElementById('activityModal')
  if (modal) modal.classList.add('hidden')
}

function showFormError(msg) {
  const el = document.getElementById('activityFormError')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function hideFormError() {
  const el = document.getElementById('activityFormError')
  if (el) el.classList.add('hidden')
}

function setupImageUpload() {
  const uploadZone = document.getElementById('activityImageUploadZone')
  const fileInput = document.getElementById('activityImageInput')
  const preview = document.getElementById('activityImagePreview')
  const previewImg = document.getElementById('activityImagePreviewImg')
  const removeBtn = document.getElementById('activityRemoveImageBtn')
  const imageUrl = document.getElementById('activityImageUrl')

  uploadZone?.addEventListener('click', () => fileInput?.click())

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]
    if (file) await uploadActivityImage(file)
  })

  uploadZone?.addEventListener('dragover', (e) => {
    e.preventDefault()
    uploadZone.classList.add('border-primary', 'bg-primary/5')
  })

  uploadZone?.addEventListener('dragleave', () => {
    uploadZone.classList.remove('border-primary', 'bg-primary/5')
  })

  uploadZone?.addEventListener('drop', async (e) => {
    e.preventDefault()
    uploadZone.classList.remove('border-primary', 'bg-primary/5')
    const file = e.dataTransfer?.files?.[0]
    if (file) await uploadActivityImage(file)
  })

  removeBtn?.addEventListener('click', () => {
    if (imageUrl) imageUrl.value = ''
    if (fileInput) fileInput.value = ''
    if (previewImg) previewImg.src = ''
    preview?.classList.add('hidden')
    uploadZone?.classList.remove('hidden')
  })
}

function resetImageUpload() {
  const imageUrl = document.getElementById('activityImageUrl')
  if (imageUrl) imageUrl.value = ''
  const fileInput = document.getElementById('activityImageInput')
  if (fileInput) fileInput.value = ''
  const previewImg = document.getElementById('activityImagePreviewImg')
  if (previewImg) previewImg.src = ''
  document.getElementById('activityImagePreview')?.classList.add('hidden')
  document.getElementById('activityImageUploadZone')?.classList.remove('hidden')
}

async function uploadActivityImage(file) {
  if (!file.type.startsWith('image/')) {
    showFormError('Debe ser un archivo de imagen')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    showFormError('Tamaño máximo: 5MB')
    return
  }
  try {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiFetch('/api/upload/content', { method: 'POST', body: formData, headers: {} })
    if (response.data?.url) {
      document.getElementById('activityImageUrl').value = response.data.url
      document.getElementById('activityImagePreviewImg').src = response.data.url
      document.getElementById('activityImageUploadZone')?.classList.add('hidden')
      document.getElementById('activityImagePreview')?.classList.remove('hidden')
    }
  } catch (err) {
    showFormError('Error al subir imagen: ' + err.message)
  }
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
