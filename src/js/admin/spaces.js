import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'
import { formatUserName } from '../utils/formatUserName.js'

let allSpaces = []
let allInstructors = []

const STATUS_STYLES = {
  active: { bg: 'bg-green-100', text: 'text-green-700', icon: 'check_circle' },
  inactive: { bg: 'bg-slate-100', text: 'text-slate-700', icon: 'cancel' }
}

export async function initAdminSpaces() {
  const user = await requireAdmin()
  if (!user) return

  await loadSpaces()

  document.getElementById('createSpaceBtn')
    ?.addEventListener('click', () => openNewModal())

  document.getElementById('spaceModalOverlay')
    ?.addEventListener('click', closeModal)

  document.getElementById('cancelSpaceBtn')
    ?.addEventListener('click', closeModal)

  document.getElementById('spaceForm')
    ?.addEventListener('submit', saveSpace)

  // Image upload
  setupImageUpload()

  // GPS URL deprecation warning
  setupGpsLocationWarning()

  const container = document.getElementById('spacesContainer')
  container?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const { action, id } = btn.dataset
    const spaceId = parseInt(id)
    if (action === 'edit') openEditModal(spaceId)
    if (action === 'delete') confirmDelete(spaceId)
    if (action === 'toggle-active') toggleActive(spaceId)
  })

  window.addEventListener('languageChanged', () => {
    if (container && allSpaces.length > 0) {
      renderSpaces(container)
    }
  })
}

async function loadSpaces() {
  const container = document.getElementById('spacesContainer')
  const loading = document.getElementById('spacesLoading')
  const empty = document.getElementById('spacesEmpty')

  loading?.classList.remove('hidden')
  container?.classList.add('hidden')
  empty?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/spaces')
    allSpaces = (data.data || []).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
    )

    loading?.classList.add('hidden')

    if (allSpaces.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderSpaces(container)
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

function renderSpaces(container) {
  container.innerHTML = allSpaces.map(space => {
    const status = space.active ? STATUS_STYLES.active : STATUS_STYLES.inactive
    const statusLabel = space.active ? t('status.active') : t('status.inactive')

    const instructorCount = space.instructors ? space.instructors.length : 0
    const instructorText = instructorCount === 0
      ? t('list.noInstructors')
      : `${instructorCount} ${instructorCount === 1 ? t('list.instructorCount') : t('list.instructorCountPlural')}`

    const addressSnippet = (space.address || '').substring(0, 80)

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1 min-w-0 flex gap-4">
            ${space.image ? `
              <img src="${escapeHtml(space.image)}" alt="${escapeHtml(space.name)}" class="w-20 h-20 rounded-xl object-cover shrink-0" />
            ` : `
              <div class="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <span class="material-symbols-outlined text-slate-400">home</span>
              </div>
            `}
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-primary-dark">${escapeHtml(space.name)}</h3>
              <p class="text-sm text-slate-500 mt-1">${escapeHtml(instructorText)}</p>
              ${addressSnippet ? `
                <p class="text-xs text-slate-400 mt-1 truncate">${escapeHtml(addressSnippet)}</p>
              ` : ''}
              <div class="flex items-center gap-2 mt-2">
                <span class="${status.bg} ${status.text} text-xs font-medium px-2 py-1 rounded-full inline-flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">${status.icon}</span>
                  ${escapeHtml(statusLabel)}
                </span>
                ${space.municipality ? `
                  <span class="text-xs text-slate-500">${escapeHtml(space.municipality)}</span>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button data-action="toggle-active" data-id="${space.id}"
                    class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="${space.active ? 'Desactivar' : 'Activar'}">
              <span class="material-symbols-outlined text-sm">${space.active ? 'visibility_off' : 'visibility'}</span>
            </button>
            <button data-action="edit" data-id="${space.id}"
                    class="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="${t('actions.edit')}">
              <span class="material-symbols-outlined text-sm">edit</span>
            </button>
            <button data-action="delete" data-id="${space.id}"
                    class="p-2 text-accent-terracotta hover:bg-red-50 rounded-lg transition-colors"
                    title="${t('actions.delete')}">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>
    `
  }).join('')
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

async function uploadImage(file) {
  const preview = document.getElementById('imagePreview')
  const previewImg = document.getElementById('imagePreviewImg')
  const uploadZone = document.getElementById('imageUploadZone')
  const imageUrl = document.getElementById('imageUrl')

  // Validate file
  if (!file.type.startsWith('image/')) {
    showFormError(t('errors.uploadError') + ': Debe ser una imagen')
    return
  }

  if (file.size > 5 * 1024 * 1024) { // 5MB
    showFormError(t('errors.uploadError') + ': Tamaño máximo 5MB')
    return
  }

  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await apiFetch('/api/upload/content', {
      method: 'POST',
      body: formData,
      headers: {}
    })

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

async function loadInstructors() {
  try {
    const response = await apiFetch('/api/users')
    const users = response.data || []
    // Filter only instructors and admins
    allInstructors = users.filter(u => u.role === 'instructor' || u.role === 'admin')
  } catch (err) {
    console.error('Error loading instructors:', err)
    allInstructors = []
  }
}

function populateInstructorCheckboxes(selectedInstructorIds = []) {
  const container = document.getElementById('instructorsCheckboxes')
  if (!container) return

  if (allInstructors.length === 0) {
    container.innerHTML = '<p class="text-xs text-slate-400" data-i18n="modal.noInstructors">No hay instructores disponibles</p>'
    return
  }

  container.innerHTML = allInstructors.map(instructor => {
    const isChecked = selectedInstructorIds.includes(instructor.id)
    return `
      <label class="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
        <input type="checkbox"
               name="instructorIds"
               value="${instructor.id}"
               ${isChecked ? 'checked' : ''}
               class="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary" />
        <span class="text-sm text-slate-700">${escapeHtml(formatUserName(instructor))}</span>
        <span class="text-xs text-slate-400">(${escapeHtml(instructor.email)})</span>
      </label>
    `
  }).join('')

  // Initialize order list based on selection
  updateInstructorOrderList(selectedInstructorIds)

  // Listen for checkbox changes to update order list
  container.querySelectorAll('input[name="instructorIds"]').forEach(cb => {
    cb.addEventListener('change', () => updateInstructorOrderList())
  })
}

// Ordered list of instructor IDs (maintained as user reorders)
let instructorOrderedIds = []

function updateInstructorOrderList(initialOrder = null) {
  const section = document.getElementById('instructorOrderSection')
  const list = document.getElementById('instructorOrderList')
  if (!section || !list) return

  const checkedIds = Array.from(
    document.querySelectorAll('input[name="instructorIds"]:checked')
  ).map(cb => parseInt(cb.value))

  if (checkedIds.length < 2) {
    section.classList.add('hidden')
    instructorOrderedIds = checkedIds
    return
  }

  // If initialOrder provided, use it; otherwise merge with existing order
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
    const instructor = allInstructors.find(i => i.id === id)
    if (!instructor) return ''
    const isFirst = index === 0
    const isLast = index === instructorOrderedIds.length - 1
    return `
      <div class="flex items-center gap-2 bg-white rounded-xl p-2 border border-slate-100" data-instructor-id="${id}">
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
      </div>
    `
  }).join('')

  list.addEventListener('click', handleOrderListClick, { once: true })
}

function handleOrderListClick(e) {
  const btn = e.target.closest('[data-order-action]')
  const list = document.getElementById('instructorOrderList')
  if (!list) return

  // Re-attach listener for next click
  list.addEventListener('click', handleOrderListClick, { once: true })

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

async function openNewModal() {
  const modal = document.getElementById('spaceModal')
  const title = document.getElementById('spaceModalTitle')
  const form = document.getElementById('spaceForm')

  if (title) title.setAttribute('data-i18n', 'modal.newTitle')
  if (title) title.textContent = t('modal.newTitle')

  form?.reset()
  document.getElementById('spaceId').value = ''
  document.getElementById('imageUrl').value = ''
  document.getElementById('spaceActive').checked = true
  checkGpsUrl()

  // Reset image preview
  document.getElementById('imagePreview')?.classList.add('hidden')
  document.getElementById('imageUploadZone')?.classList.remove('hidden')

  // Load and populate instructors
  instructorOrderedIds = []
  await loadInstructors()
  populateInstructorCheckboxes()

  hideFormError()
  modal?.classList.remove('hidden')
}

async function openEditModal(id) {
  const space = allSpaces.find(s => s.id === id)
  if (!space) return

  const modal = document.getElementById('spaceModal')
  const title = document.getElementById('spaceModalTitle')
  const form = document.getElementById('spaceForm')

  if (title) title.setAttribute('data-i18n', 'modal.editTitle')
  if (title) title.textContent = t('modal.editTitle')

  // Populate form
  document.getElementById('spaceId').value = space.id
  document.getElementById('spaceName').value = space.name || ''
  document.getElementById('spaceNameEn').value = space.name_en || ''
  document.getElementById('spaceAddress').value = space.address || ''
  document.getElementById('spaceAddressEn').value = space.address_en || ''
  document.getElementById('spaceMunicipality').value = space.municipality || ''
  document.getElementById('spaceGpsLocation').value = space.gps_location || ''
  checkGpsUrl()
  document.getElementById('spacePhone').value = space.phone || ''
  document.getElementById('spaceEmail').value = space.email || ''
  document.getElementById('spaceWebsite').value = space.website_url || ''
  document.getElementById('spaceActive').checked = space.active

  // Disciplines (convert array to comma-separated strings - Spanish and English)
  const disciplinesEs = space.disciplines && space.disciplines.length > 0
    ? space.disciplines.filter(d => d).map(d => d.name || d.discipline_name || '').filter(n => n).join(', ')
    : ''
  const disciplinesEn = space.disciplines && space.disciplines.length > 0
    ? space.disciplines.filter(d => d).map(d => d.name_en || '').filter(n => n).join(', ')
    : ''
  document.getElementById('spaceDisciplines').value = disciplinesEs
  document.getElementById('spaceDisciplinesEn').value = disciplinesEn

  // Image
  if (space.image) {
    document.getElementById('imageUrl').value = space.image
    document.getElementById('imagePreviewImg').src = space.image
    document.getElementById('imagePreview')?.classList.remove('hidden')
    document.getElementById('imageUploadZone')?.classList.add('hidden')
  } else {
    document.getElementById('imageUrl').value = ''
    document.getElementById('imagePreview')?.classList.add('hidden')
    document.getElementById('imageUploadZone')?.classList.remove('hidden')
  }

  // Load and populate instructors with selected ones (preserve existing order)
  instructorOrderedIds = []
  await loadInstructors()
  const selectedInstructorIds = space.instructors ? space.instructors.map(i => i.id) : []
  populateInstructorCheckboxes(selectedInstructorIds)

  hideFormError()
  modal?.classList.remove('hidden')
}

function setupGpsLocationWarning() {
  const input = document.getElementById('spaceGpsLocation')
  if (!input) return

  const warning = document.createElement('p')
  warning.id = 'gpsUrlWarning'
  warning.className = 'hidden text-xs text-accent-terracotta mt-1'
  const icon = document.createElement('span')
  icon.className = 'material-symbols-outlined text-xs align-middle mr-1'
  icon.textContent = 'warning'
  const text = document.createElement('span')
  text.id = 'gpsUrlWarningText'
  warning.appendChild(icon)
  warning.appendChild(text)
  input.insertAdjacentElement('afterend', warning)

  input.addEventListener('input', checkGpsUrl)
}

function checkGpsUrl() {
  const input = document.getElementById('spaceGpsLocation')
  const warning = document.getElementById('gpsUrlWarning')
  const text = document.getElementById('gpsUrlWarningText')
  if (!input || !warning) return

  const value = input.value.trim()
  const isDeprecated = value.includes('maps.app.goo.gl') ||
    (value.includes('goo.gl') && value.includes('maps'))

  if (isDeprecated) {
    if (text) text.textContent = t('errors.gpsUrlDeprecated')
    warning.classList.remove('hidden')
  } else {
    warning.classList.add('hidden')
  }
}

function closeModal() {
  document.getElementById('spaceModal')?.classList.add('hidden')
}

async function saveSpace(e) {
  e.preventDefault()

  const saveBtn = document.getElementById('saveSpaceBtn')
  const originalText = saveBtn?.textContent || ''
  if (saveBtn) saveBtn.disabled = true
  if (saveBtn) saveBtn.textContent = t('modal.saving')

  hideFormError()

  const id = document.getElementById('spaceId').value
  const name = document.getElementById('spaceName').value.trim()

  if (!name) {
    showFormError(t('errors.requiredFields'))
    if (saveBtn) saveBtn.disabled = false
    if (saveBtn) saveBtn.textContent = originalText
    return
  }

  // Get instructor IDs in display order (from order list when ≥2, else from checkboxes)
  const section = document.getElementById('instructorOrderSection')
  const instructor_ids = section && !section.classList.contains('hidden')
    ? [...instructorOrderedIds]
    : Array.from(document.querySelectorAll('input[name="instructorIds"]:checked')).map(cb => parseInt(cb.value))

  // Parse disciplines (Spanish and English)
  const disciplinesEs = document.getElementById('spaceDisciplines').value
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length > 0)

  const disciplinesEn = document.getElementById('spaceDisciplinesEn').value
    .split(',')
    .map(d => d.trim())
    .filter(d => d.length > 0)

  // Combine disciplines into objects with name_es and name_en
  const disciplines = disciplinesEs.map((nameEs, index) => ({
    name_es: nameEs,
    name_en: disciplinesEn[index] || null
  }))

  const body = {
    name,
    name_en: document.getElementById('spaceNameEn').value.trim() || null,
    image: document.getElementById('imageUrl').value || null,
    address: document.getElementById('spaceAddress').value.trim() || null,
    address_en: document.getElementById('spaceAddressEn').value.trim() || null,
    municipality: document.getElementById('spaceMunicipality').value.trim() || null,
    gps_location: document.getElementById('spaceGpsLocation').value.trim() || null,
    phone: document.getElementById('spacePhone').value.trim() || null,
    email: document.getElementById('spaceEmail').value.trim() || null,
    website_url: document.getElementById('spaceWebsite').value.trim() || null,
    active: document.getElementById('spaceActive').checked,
    instructor_ids,
    disciplines
  }

  try {
    if (id) {
      await apiFetch(`/api/spaces/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      })
    } else {
      await apiFetch('/api/spaces', {
        method: 'POST',
        body: JSON.stringify(body)
      })
    }

    closeModal()
    await loadSpaces()
  } catch (err) {
    showFormError(t('errors.saveError') + ': ' + err.message)
  }

  if (saveBtn) saveBtn.disabled = false
  if (saveBtn) saveBtn.textContent = originalText
}

async function toggleActive(id) {
  const space = allSpaces.find(s => s.id === id)
  if (!space) return

  try {
    await apiFetch(`/api/spaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !space.active })
    })
    await loadSpaces()
  } catch (err) {
    alert(t('errors.saveError') + ': ' + err.message)
  }
}

async function confirmDelete(id) {
  const space = allSpaces.find(s => s.id === id)
  if (!space) return

  if (!confirm(t('confirmDelete'))) return

  try {
    await apiFetch(`/api/spaces/${id}`, { method: 'DELETE' })
    await loadSpaces()
  } catch (err) {
    alert(t('errors.deleteError') + ': ' + err.message)
  }
}

function showFormError(message) {
  const errorEl = document.getElementById('spaceFormError')
  if (errorEl) {
    errorEl.textContent = message
    errorEl.classList.remove('hidden')
  }
}

function hideFormError() {
  const errorEl = document.getElementById('spaceFormError')
  errorEl?.classList.add('hidden')
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
