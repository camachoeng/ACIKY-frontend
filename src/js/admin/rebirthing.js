import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { formatUserName } from '../utils/formatUserName.js'
import { t } from '../i18n.js'

let allSessions = []
let allInstructors = []

export async function initAdminRebirthing() {
  const user = await requireAdmin()
  if (!user) return

  await Promise.all([loadSessions(), loadInstructors()])

  document.getElementById('createSessionBtn')
    ?.addEventListener('click', openCreateModal)

  document.getElementById('sessionModalOverlay')
    ?.addEventListener('click', closeModal)

  document.getElementById('cancelSessionBtn')
    ?.addEventListener('click', closeModal)

  document.getElementById('sessionForm')
    ?.addEventListener('submit', saveSession)

  setupImageUpload()

  document.getElementById('sessionsContainer')
    ?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const { action, id } = btn.dataset
      const sessionId = parseInt(id)
      if (action === 'edit') openEditModal(sessionId)
      if (action === 'delete') confirmDelete(sessionId)
      if (action === 'toggle') toggleActive(sessionId)
    })
}

async function loadSessions() {
  const container = document.getElementById('sessionsContainer')
  const loading = document.getElementById('sessionsLoading')
  const empty = document.getElementById('sessionsEmpty')

  loading?.classList.remove('hidden')
  container?.classList.add('hidden')
  empty?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/rebirthing')
    allSessions = data.data || []
    loading?.classList.add('hidden')

    if (allSessions.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderSessions(container)
    }
  } catch (err) {
    loading?.classList.add('hidden')
    if (container) {
      container.classList.remove('hidden')
      container.innerHTML = `
        <div class="text-center py-8 text-red-500 text-sm">
          Error al cargar ceremonias: ${escapeHtml(err.message)}
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

function populateInstructorSelect(selectedId) {
  const select = document.getElementById('sessionInstructor')
  if (!select) return
  select.innerHTML = `<option value="">${t('modal.noInstructor')}</option>` +
    allInstructors.map(i => `<option value="${i.id}" ${i.id === selectedId ? 'selected' : ''}>${escapeHtml(formatUserName(i))}</option>`).join('')
}

function renderSessions(container) {
  container.innerHTML = allSessions.map(s => {
    const instructorName = s.instructor_name && s.instructor_last_name
      ? formatUserName({ name: s.instructor_name, last_name: s.instructor_last_name, spiritual_name: s.instructor_spiritual_name })
      : (s.instructor_name || t('status.noInstructor'))

    return `
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h3 class="font-bold text-primary-dark">${escapeHtml(s.name)}</h3>
            ${s.active
              ? `<span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">${t('status.active')}</span>`
              : `<span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">${t('status.inactive')}</span>`}
          </div>
          ${s.date ? `
          <div class="flex items-center gap-1 text-xs text-primary mb-1">
            <span class="material-symbols-outlined text-xs">calendar_month</span>
            <span>${formatDateTime(s.date)}</span>
          </div>` : ''}
          ${s.address ? `
          <div class="flex items-center gap-1 text-xs text-slate-500 mb-1">
            <span class="material-symbols-outlined text-xs">location_on</span>
            <span>${escapeHtml(s.address)}</span>
          </div>` : ''}
          <div class="flex items-center gap-1 text-xs text-slate-400">
            <span class="material-symbols-outlined text-xs">person</span>
            <span>${escapeHtml(instructorName)}</span>
          </div>
        </div>
        <div class="flex gap-1 flex-shrink-0">
          <button data-action="toggle" data-id="${s.id}" class="p-2 rounded-xl hover:bg-slate-50 ${s.active ? 'text-green-600' : 'text-slate-400'}" title="${s.active ? 'Desactivar' : 'Activar'}">
            <span class="material-symbols-outlined text-sm">${s.active ? 'toggle_on' : 'toggle_off'}</span>
          </button>
          <button data-action="edit" data-id="${s.id}" class="p-2 rounded-xl hover:bg-slate-50 text-primary">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button data-action="delete" data-id="${s.id}" class="p-2 rounded-xl hover:bg-slate-50 text-accent-terracotta">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>`
  }).join('')
}

function openCreateModal() {
  populateInstructorSelect(null)
  document.getElementById('sessionModalTitle').textContent = t('modal.newTitle')
  document.getElementById('sessionId').value = ''
  document.getElementById('sessionName').value = ''
  document.getElementById('sessionNameEn').value = ''
  document.getElementById('sessionDescription').value = ''
  document.getElementById('sessionDescriptionEn').value = ''
  document.getElementById('sessionAddress').value = ''
  document.getElementById('sessionDate').value = ''
  document.getElementById('sessionTime').value = ''
  document.getElementById('sessionActive').checked = true
  resetImageUpload()
  hideFormError()
  document.getElementById('sessionModal')?.classList.remove('hidden')
}

function openEditModal(id) {
  const s = allSessions.find(s => s.id === id)
  if (!s) return

  populateInstructorSelect(s.instructor_id)
  document.getElementById('sessionModalTitle').textContent = t('modal.editTitle')
  document.getElementById('sessionId').value = s.id
  document.getElementById('sessionName').value = s.name || ''
  document.getElementById('sessionNameEn').value = s.name_en || ''
  document.getElementById('sessionDescription').value = s.description || ''
  document.getElementById('sessionDescriptionEn').value = s.description_en || ''
  document.getElementById('sessionAddress').value = s.address || ''

  if (s.date) {
    const dt = new Date(s.date)
    document.getElementById('sessionDate').value = dt.toISOString().split('T')[0]
    document.getElementById('sessionTime').value = dt.toTimeString().substring(0, 5)
  } else {
    document.getElementById('sessionDate').value = ''
    document.getElementById('sessionTime').value = ''
  }

  document.getElementById('sessionActive').checked = !!s.active

  // Image
  document.getElementById('imageUrl').value = s.image || ''
  if (s.image) {
    document.getElementById('imagePreviewImg').src = s.image
    document.getElementById('imagePreview').classList.remove('hidden')
    document.getElementById('imageUploadZone').classList.add('hidden')
  } else {
    resetImageUpload()
  }

  hideFormError()
  document.getElementById('sessionModal')?.classList.remove('hidden')
}

async function saveSession(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveSessionBtn')
  const originalText = saveBtn.textContent
  saveBtn.disabled = true
  saveBtn.textContent = t('modal.saving')
  hideFormError()

  const id = document.getElementById('sessionId').value
  const date = document.getElementById('sessionDate').value
  const time = document.getElementById('sessionTime').value
  const datetime = date ? (time ? `${date}T${time}:00` : `${date}T00:00:00`) : null

  const body = {
    name: document.getElementById('sessionName').value.trim(),
    name_en: document.getElementById('sessionNameEn').value.trim() || null,
    description: document.getElementById('sessionDescription').value.trim() || null,
    description_en: document.getElementById('sessionDescriptionEn').value.trim() || null,
    address: document.getElementById('sessionAddress').value.trim() || null,
    instructor_id: document.getElementById('sessionInstructor').value || null,
    date: datetime,
    active: document.getElementById('sessionActive').checked,
    image: document.getElementById('imageUrl').value || null
  }

  try {
    if (id) {
      await apiFetch(`/api/rebirthing/${id}`, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await apiFetch('/api/rebirthing', { method: 'POST', body: JSON.stringify(body) })
    }
    closeModal()
    await loadSessions()
  } catch (err) {
    showFormError(err.message || 'Error al guardar')
  }

  saveBtn.disabled = false
  saveBtn.textContent = originalText
}

async function toggleActive(id) {
  const s = allSessions.find(s => s.id === id)
  if (!s) return
  try {
    await apiFetch(`/api/rebirthing/${id}`, { method: 'PUT', body: JSON.stringify({ active: !s.active }) })
    await loadSessions()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

async function confirmDelete(id) {
  const s = allSessions.find(s => s.id === id)
  if (!s) return
  if (!confirm(`Eliminar ceremonia "${s.name}"?`)) return
  try {
    await apiFetch(`/api/rebirthing/${id}`, { method: 'DELETE' })
    await loadSessions()
  } catch (err) {
    alert('Error al eliminar: ' + err.message)
  }
}

function closeModal() {
  document.getElementById('sessionModal')?.classList.add('hidden')
}

function showFormError(msg) {
  const el = document.getElementById('sessionFormError')
  if (el) { el.textContent = msg; el.classList.remove('hidden') }
}

function hideFormError() {
  const el = document.getElementById('sessionFormError')
  if (el) el.classList.add('hidden')
}

function formatDateTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' ' + date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
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
    showFormError('Error al subir imagen: ' + err.message)
  }
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
