import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

let allEvents = []

export async function initAdminEvents() {
  const user = await requireAdmin()
  if (!user) return

  await loadEvents()

  document.getElementById('createEventBtn')
    ?.addEventListener('click', openCreateModal)

  document.getElementById('eventModalOverlay')
    ?.addEventListener('click', closeModal)

  document.getElementById('cancelEventBtn')
    ?.addEventListener('click', closeModal)

  document.getElementById('eventForm')
    ?.addEventListener('submit', saveEvent)

  document.getElementById('eventIsOnline')
    ?.addEventListener('change', toggleAddressField)

  setupImageUpload()

  document.getElementById('eventsContainer')
    ?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const { action, id } = btn.dataset
      const eventId = parseInt(id)
      if (action === 'edit') openEditModal(eventId)
      if (action === 'delete') confirmDelete(eventId)
      if (action === 'toggle') toggleActive(eventId)
    })
}

async function loadEvents() {
  const container = document.getElementById('eventsContainer')
  const loading = document.getElementById('eventsLoading')
  const empty = document.getElementById('eventsEmpty')

  loading?.classList.remove('hidden')
  container?.classList.add('hidden')
  empty?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/events')
    allEvents = data.data || []
    loading?.classList.add('hidden')

    if (allEvents.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderEvents(container)
    }
  } catch (err) {
    loading?.classList.add('hidden')
    if (container) {
      container.classList.remove('hidden')
      container.innerHTML = `
        <div class="text-center py-8 text-red-500 text-sm">
          Error al cargar eventos: ${escapeHtml(err.message)}
        </div>`
    }
  }
}

function renderEvents(container) {
  container.innerHTML = allEvents.map(ev => {
    const onlineBadge = ev.is_online
      ? `<span class="px-2 py-0.5 bg-accent-teal/10 text-accent-teal text-[10px] font-bold rounded-full">${t('status.online')}</span>`
      : `<span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">${t('status.inPerson')}</span>`

    const activeBadge = ev.is_active
      ? `<span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">${t('status.active')}</span>`
      : `<span class="px-2 py-0.5 bg-slate-100 text-slate-400 text-[10px] font-bold rounded-full">${t('status.inactive')}</span>`

    return `
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-start gap-4">
        ${ev.image_url ? `
          <div class="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
            <img src="${escapeHtml(ev.image_url)}" alt="${escapeHtml(ev.name)}" class="w-full h-full object-cover" />
          </div>` : `
          <div class="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span class="material-symbols-outlined text-primary text-3xl">event</span>
          </div>`}
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h3 class="font-bold text-primary-dark">${escapeHtml(ev.name)}</h3>
            ${onlineBadge}
            ${activeBadge}
          </div>
          ${ev.date ? `
          <div class="flex items-center gap-1 text-xs text-primary mb-1">
            <span class="material-symbols-outlined text-xs">calendar_month</span>
            <span>${formatDateTime(ev.date)}</span>
          </div>` : ''}
          ${ev.address && !ev.is_online ? `
          <div class="flex items-center gap-1 text-xs text-slate-500">
            <span class="material-symbols-outlined text-xs">location_on</span>
            <span>${escapeHtml(ev.address)}</span>
          </div>` : ''}
          ${ev.event_url ? `
          <div class="flex items-center gap-1 text-xs text-accent-teal mt-1">
            <span class="material-symbols-outlined text-xs">open_in_new</span>
            <a href="${escapeHtml(ev.event_url)}" target="_blank" rel="noopener noreferrer" class="hover:underline truncate max-w-[200px]">${escapeHtml(ev.event_url)}</a>
          </div>` : ''}
        </div>
        <div class="flex gap-1 flex-shrink-0">
          <button data-action="toggle" data-id="${ev.id}" class="p-2 rounded-xl hover:bg-slate-50 ${ev.is_active ? 'text-green-600' : 'text-slate-400'}" title="${ev.is_active ? 'Desactivar' : 'Activar'}">
            <span class="material-symbols-outlined text-sm">${ev.is_active ? 'toggle_on' : 'toggle_off'}</span>
          </button>
          <button data-action="edit" data-id="${ev.id}" class="p-2 rounded-xl hover:bg-slate-50 text-primary">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button data-action="delete" data-id="${ev.id}" class="p-2 rounded-xl hover:bg-slate-50 text-accent-terracotta">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>`
  }).join('')
}

function openCreateModal() {
  document.getElementById('eventModalTitle').textContent = t('modal.newTitle')
  document.getElementById('eventId').value = ''
  document.getElementById('eventName').value = ''
  document.getElementById('eventNameEn').value = ''
  document.getElementById('eventDescription').value = ''
  document.getElementById('eventDescriptionEn').value = ''
  document.getElementById('eventDate').value = ''
  document.getElementById('eventTime').value = ''
  document.getElementById('eventIsOnline').checked = false
  document.getElementById('eventAddress').value = ''
  document.getElementById('eventUrl').value = ''
  document.getElementById('eventActive').checked = true
  document.getElementById('addressField').classList.remove('hidden')
  resetImageUpload()
  hideFormError()
  document.getElementById('eventModal')?.classList.remove('hidden')
}

function openEditModal(id) {
  const ev = allEvents.find(e => e.id === id)
  if (!ev) return

  document.getElementById('eventModalTitle').textContent = t('modal.editTitle')
  document.getElementById('eventId').value = ev.id
  document.getElementById('eventName').value = ev.name || ''
  document.getElementById('eventNameEn').value = ev.name_en || ''
  document.getElementById('eventDescription').value = ev.description || ''
  document.getElementById('eventDescriptionEn').value = ev.description_en || ''
  document.getElementById('eventIsOnline').checked = !!ev.is_online
  document.getElementById('eventAddress').value = ev.address || ''
  document.getElementById('eventUrl').value = ev.event_url || ''
  document.getElementById('eventActive').checked = !!ev.is_active

  const addressField = document.getElementById('addressField')
  if (addressField) addressField.classList.toggle('hidden', !!ev.is_online)

  if (ev.date) {
    const dt = new Date(ev.date)
    document.getElementById('eventDate').value = dt.toISOString().split('T')[0]
    document.getElementById('eventTime').value = dt.toTimeString().substring(0, 5)
  } else {
    document.getElementById('eventDate').value = ''
    document.getElementById('eventTime').value = ''
  }

  document.getElementById('imageUrl').value = ev.image_url || ''
  if (ev.image_url) {
    document.getElementById('imagePreviewImg').src = ev.image_url
    document.getElementById('imagePreview').classList.remove('hidden')
    document.getElementById('imageUploadZone').classList.add('hidden')
  } else {
    resetImageUpload()
  }

  hideFormError()
  document.getElementById('eventModal')?.classList.remove('hidden')
}

function toggleAddressField() {
  const isOnline = document.getElementById('eventIsOnline').checked
  document.getElementById('addressField').classList.toggle('hidden', isOnline)
}

async function saveEvent(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveEventBtn')
  const originalText = saveBtn.textContent
  saveBtn.disabled = true
  saveBtn.textContent = t('modal.saving')
  hideFormError()

  const id = document.getElementById('eventId').value
  const date = document.getElementById('eventDate').value
  const time = document.getElementById('eventTime').value
  const datetime = date ? (time ? `${date}T${time}:00` : `${date}T00:00:00`) : null

  const body = {
    name: document.getElementById('eventName').value.trim(),
    name_en: document.getElementById('eventNameEn').value.trim() || null,
    description: document.getElementById('eventDescription').value.trim() || null,
    description_en: document.getElementById('eventDescriptionEn').value.trim() || null,
    image_url: document.getElementById('imageUrl').value || null,
    date: datetime,
    is_online: document.getElementById('eventIsOnline').checked,
    address: document.getElementById('eventAddress').value.trim() || null,
    event_url: document.getElementById('eventUrl').value.trim() || null,
    is_active: document.getElementById('eventActive').checked
  }

  try {
    if (id) {
      await apiFetch(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await apiFetch('/api/events', { method: 'POST', body: JSON.stringify(body) })
    }
    closeModal()
    await loadEvents()
  } catch (err) {
    showFormError(err.message || 'Error al guardar')
  }

  saveBtn.disabled = false
  saveBtn.textContent = originalText
}

async function toggleActive(id) {
  const ev = allEvents.find(e => e.id === id)
  if (!ev) return
  try {
    await apiFetch(`/api/events/${id}`, { method: 'PUT', body: JSON.stringify({ is_active: !ev.is_active }) })
    await loadEvents()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

async function confirmDelete(id) {
  const ev = allEvents.find(e => e.id === id)
  if (!ev) return
  if (!confirm(`Eliminar evento "${ev.name}"?`)) return
  try {
    await apiFetch(`/api/events/${id}`, { method: 'DELETE' })
    await loadEvents()
  } catch (err) {
    alert('Error al eliminar: ' + err.message)
  }
}

function closeModal() {
  document.getElementById('eventModal')?.classList.add('hidden')
}

function showFormError(msg) {
  const el = document.getElementById('eventFormError')
  if (el) { el.textContent = msg; el.classList.remove('hidden') }
}

function hideFormError() {
  const el = document.getElementById('eventFormError')
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
