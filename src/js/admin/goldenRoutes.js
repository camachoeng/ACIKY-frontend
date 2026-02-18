import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'
import { formatUserName } from '../utils/formatUserName.js'

let allRoutes = []
let allInstructors = []

const STATUS_STYLES = {
  active: { bg: 'bg-green-100', text: 'text-green-700', icon: 'check_circle' },
  planning: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'pending' }
}

export async function initAdminGoldenRoutes() {
  const user = await requireAdmin()
  if (!user) return

  await Promise.all([loadRoutes(), loadInstructors()])

  document.getElementById('createRouteBtn')
    ?.addEventListener('click', openCreateModal)

  document.getElementById('routeModalOverlay')
    ?.addEventListener('click', closeModal)

  document.getElementById('cancelRouteBtn')
    ?.addEventListener('click', closeModal)

  document.getElementById('routeForm')
    ?.addEventListener('submit', saveRoute)

  setupImageUpload()

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

async function loadInstructors() {
  try {
    const data = await apiFetch('/api/users')
    allInstructors = (data.data || []).filter(u => u.role === 'instructor')
  } catch (err) {
    console.error('Error loading instructors:', err)
  }
}

function populateInstructorSelect() {
  const select = document.getElementById('routeInstructors')

  if (!select) {
    console.warn('routeInstructors select not found in DOM')
    return
  }

  const options = allInstructors
    .map(i => `<option value="${i.id}">${escapeHtml(formatUserName(i))}</option>`)
    .join('')

  select.innerHTML = options
}

function renderRoutes(container) {
  container.innerHTML = allRoutes.map(item => {
    const status = STATUS_STYLES[item.status] || STATUS_STYLES.planning
    const statusLabel = item.status === 'active' ? t('status.active') : t('status.planning')
    const instructorNames = item.instructors && item.instructors.length > 0
      ? item.instructors.map(i => formatUserName(i)).join(', ')
      : 'Sin instructor'

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
            ${item.start_date || item.end_date ? `
            <div class="flex items-center gap-1 text-xs text-slate-400 mt-1">
              <span class="material-symbols-outlined text-xs">schedule</span>
              <span>${item.start_date ? formatDate(item.start_date) : '---'} → ${item.end_date ? formatDate(item.end_date) : '---'}</span>
            </div>` : ''}
            <div class="flex flex-wrap gap-3 text-xs text-slate-400 mt-2">
              ${item.participants_count ? `<span>${item.participants_count}+ ${escapeHtml(t('card.participants'))}</span>` : ''}
              ${item.spaces_established ? `<span>${item.spaces_established} ${escapeHtml(t('card.spaces'))}</span>` : ''}
              <span class="flex items-center gap-1"><span class="material-symbols-outlined text-xs">person</span>${escapeHtml(instructorNames)}</span>
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

function formatDate(dateStr) {
  if (!dateStr) return ''
  // Split the date string to avoid timezone issues
  const datePart = dateStr.split('T')[0]
  const [year, month, day] = datePart.split('-')
  // Create date in local timezone
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
}

function openCreateModal() {
  populateInstructorSelect()

  document.getElementById('routeModalTitle').setAttribute('data-i18n', 'modal.newTitle')
  document.getElementById('routeModalTitle').textContent = t('modal.newTitle')
  document.getElementById('routeId').value = ''
  document.getElementById('routeName').value = ''
  document.getElementById('routeNameEn').value = ''
  document.getElementById('routeOrigin').value = ''
  document.getElementById('routeDestination').value = ''
  document.getElementById('routeDescription').value = ''
  document.getElementById('routeDescriptionEn').value = ''
  document.getElementById('routeStartDate').value = ''
  document.getElementById('routeEndDate').value = ''
  document.getElementById('routeStatus').value = 'active'
  document.getElementById('routeParticipants').value = '0'
  document.getElementById('routeSpaces').value = '0'

  const instructorSelect = document.getElementById('routeInstructors')
  if (instructorSelect) {
    Array.from(instructorSelect.options).forEach(opt => opt.selected = false)
  }

  resetImageUpload()
  hideFormError()
  document.getElementById('routeModal')?.classList.remove('hidden')
}

function openEditModal(id) {
  const item = allRoutes.find(r => r.id === id)
  if (!item) return

  populateInstructorSelect()

  document.getElementById('routeModalTitle').setAttribute('data-i18n', 'modal.editTitle')
  document.getElementById('routeModalTitle').textContent = t('modal.editTitle')
  document.getElementById('routeId').value = item.id
  document.getElementById('routeName').value = item.name || ''
  document.getElementById('routeNameEn').value = item.name_en || ''
  document.getElementById('routeOrigin').value = item.origin || ''
  document.getElementById('routeDestination').value = item.destination || ''
  document.getElementById('routeDescription').value = item.description || ''
  document.getElementById('routeDescriptionEn').value = item.description_en || ''
  document.getElementById('routeStartDate').value = item.start_date ? item.start_date.split('T')[0] : ''
  document.getElementById('routeEndDate').value = item.end_date ? item.end_date.split('T')[0] : ''
  document.getElementById('routeStatus').value = item.status || 'active'
  document.getElementById('routeParticipants').value = item.participants_count || 0
  document.getElementById('routeSpaces').value = item.spaces_established || 0

  const instructorSelect = document.getElementById('routeInstructors')
  if (instructorSelect && item.instructors) {
    const instructorIds = item.instructors.map(i => i.id.toString())
    Array.from(instructorSelect.options).forEach(opt => {
      opt.selected = instructorIds.includes(opt.value)
    })
  }

  // Image
  document.getElementById('imageUrl').value = item.image_url || ''
  if (item.image_url) {
    document.getElementById('imagePreviewImg').src = item.image_url
    document.getElementById('imagePreview').classList.remove('hidden')
    document.getElementById('imageUploadZone').classList.add('hidden')
  } else {
    resetImageUpload()
  }

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
  const startDate = document.getElementById('routeStartDate').value
  const endDate = document.getElementById('routeEndDate').value

  const instructorSelect = document.getElementById('routeInstructors')
  const selectedInstructors = Array.from(instructorSelect.selectedOptions).map(opt => parseInt(opt.value))

  const body = {
    name: document.getElementById('routeName').value.trim(),
    name_en: document.getElementById('routeNameEn').value.trim() || null,
    origin: document.getElementById('routeOrigin').value.trim(),
    destination: document.getElementById('routeDestination').value.trim(),
    description: document.getElementById('routeDescription').value.trim() || null,
    description_en: document.getElementById('routeDescriptionEn').value.trim() || null,
    start_date: startDate || null,
    end_date: endDate || null,
    status: document.getElementById('routeStatus').value,
    participants_count: parseInt(document.getElementById('routeParticipants').value) || 0,
    spaces_established: parseInt(document.getElementById('routeSpaces').value) || 0,
    instructor_ids: selectedInstructors,
    image_url: document.getElementById('imageUrl').value || null
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

function setupImageUpload() {
  const uploadZone = document.getElementById('imageUploadZone')
  const fileInput = document.getElementById('imageInput')
  const preview = document.getElementById('imagePreview')
  const previewImg = document.getElementById('imagePreviewImg')
  const removeBtn = document.getElementById('removeImageBtn')
  const imageUrl = document.getElementById('imageUrl')

  uploadZone?.addEventListener('click', () => fileInput?.click())

  fileInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]
    if (file) await uploadImage(file)
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
    if (file) await uploadImage(file)
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
  document.getElementById('imageUrl').value = ''
  const fileInput = document.getElementById('imageInput')
  if (fileInput) fileInput.value = ''
  const previewImg = document.getElementById('imagePreviewImg')
  if (previewImg) previewImg.src = ''
  document.getElementById('imagePreview')?.classList.add('hidden')
  document.getElementById('imageUploadZone')?.classList.remove('hidden')
}

async function uploadImage(file) {
  const preview = document.getElementById('imagePreview')
  const previewImg = document.getElementById('imagePreviewImg')
  const uploadZone = document.getElementById('imageUploadZone')
  const imageUrl = document.getElementById('imageUrl')

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
      if (imageUrl) imageUrl.value = response.data.url
      if (previewImg) previewImg.src = response.data.url
      uploadZone?.classList.add('hidden')
      preview?.classList.remove('hidden')
    }
  } catch (err) {
    showFormError(t('errors.uploadError') + ': ' + err.message)
  }
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
