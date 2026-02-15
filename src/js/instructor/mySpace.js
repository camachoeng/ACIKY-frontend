import { requireAuth } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

let mySpace = null
let currentUser = null

export async function initMySpace() {
  const user = await requireAuth()
  if (!user) return

  // Store user for later use
  currentUser = user

  // Only instructors and admins can access
  if (!['instructor', 'admin'].includes(user.role)) {
    window.location.href = import.meta.env.BASE_URL
    return
  }

  await loadMySpace()

  // Modal events
  const overlay = document.getElementById('spaceModalOverlay')
  if (overlay) overlay.addEventListener('click', closeModal)
  const cancelBtn = document.getElementById('cancelSpaceBtn')
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  // Form submit
  const form = document.getElementById('spaceForm')
  if (form) form.addEventListener('submit', saveSpace)

  // Image upload
  setupImageUpload()

  // Card event delegation
  const container = document.getElementById('spaceCardContainer')
  if (container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const action = btn.dataset.action
      if (action === 'edit') openEditModal()
      if (action === 'toggle') toggleActive()
    })
  }
}

async function loadMySpace() {
  const container = document.getElementById('spaceCardContainer')
  const loading = document.getElementById('spaceLoading')
  const empty = document.getElementById('spaceEmpty')
  if (!container) return

  loading?.classList.remove('hidden')
  empty?.classList.add('hidden')
  container?.classList.add('hidden')

  try {
    // Get spaces assigned to current instructor
    const data = await apiFetch('/api/spaces')
    const spaces = data.data || []

    // Get current user ID from stored user object or from currentUser
    const userId = currentUser?.id || currentUser?.user_id

    if (!userId) {
      throw new Error('No se pudo obtener el ID del usuario')
    }

    // Find first space where current user is assigned as instructor
    mySpace = spaces.find(s =>
      s.instructors && s.instructors.length > 0 &&
      s.instructors.filter(i => i).some(i => i.id === userId || i.user_id === userId)
    )

    loading?.classList.add('hidden')

    if (!mySpace) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderSpaceCard(container)
    }
  } catch (err) {
    loading?.classList.add('hidden')
    container.innerHTML = `<p class="text-center text-red-500 text-sm py-8">${escapeHtml(t('errors.loadError'))}: ${escapeHtml(err.message)}</p>`
    container.classList.remove('hidden')
  }
}

function renderSpaceCard(container) {
  if (!mySpace) return

  const disciplines = mySpace.disciplines && mySpace.disciplines.length > 0
    ? mySpace.disciplines.filter(d => d).map(d => d.name || d.discipline_name || '').filter(n => n).join(', ')
    : '-'

  container.innerHTML = `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      ${mySpace.image ? `
        <div class="relative h-48 -mt-6 -mx-6 mb-4 overflow-hidden rounded-t-2xl">
          <img src="${escapeHtml(mySpace.image)}" alt="${escapeHtml(mySpace.name)}" class="absolute inset-0 w-full h-full object-cover" />
        </div>
      ` : ''}

      <div class="flex items-start gap-4">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-2 flex-wrap">
            <h3 class="font-bold text-lg text-primary-dark">${escapeHtml(mySpace.name)}</h3>
            ${mySpace.active
              ? '<span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">Activo</span>'
              : '<span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">Inactivo</span>'}
          </div>

          ${mySpace.address ? `
            <div class="flex items-start gap-2 mb-2">
              <span class="material-symbols-outlined text-primary text-sm mt-0.5">location_on</span>
              <div>
                <p class="text-xs font-semibold text-slate-400">${t('card.address')}</p>
                <p class="text-sm text-slate-600">${escapeHtml(mySpace.address)}</p>
              </div>
            </div>
          ` : ''}

          ${mySpace.municipality ? `
            <div class="flex items-start gap-2 mb-2">
              <span class="material-symbols-outlined text-primary text-sm mt-0.5">explore</span>
              <div>
                <p class="text-xs font-semibold text-slate-400">${t('card.municipality')}</p>
                <p class="text-sm text-slate-600">${escapeHtml(mySpace.municipality)}</p>
              </div>
            </div>
          ` : ''}

          ${disciplines !== '-' ? `
            <div class="flex items-start gap-2 mb-2">
              <span class="material-symbols-outlined text-primary text-sm mt-0.5">spa</span>
              <div>
                <p class="text-xs font-semibold text-slate-400">${t('card.disciplines')}</p>
                <p class="text-sm text-slate-600">${escapeHtml(disciplines)}</p>
              </div>
            </div>
          ` : ''}

          ${mySpace.phone ? `
            <div class="flex items-start gap-2 mb-2">
              <span class="material-symbols-outlined text-primary text-sm mt-0.5">phone</span>
              <div>
                <p class="text-xs font-semibold text-slate-400">${t('card.phone')}</p>
                <p class="text-sm text-slate-600">${escapeHtml(mySpace.phone)}</p>
              </div>
            </div>
          ` : ''}

          ${mySpace.email ? `
            <div class="flex items-start gap-2">
              <span class="material-symbols-outlined text-primary text-sm mt-0.5">email</span>
              <div>
                <p class="text-xs font-semibold text-slate-400">${t('card.email')}</p>
                <p class="text-sm text-slate-600">${escapeHtml(mySpace.email)}</p>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="flex gap-1 flex-shrink-0">
          <button data-action="toggle" class="p-2 rounded-xl hover:bg-slate-50 ${mySpace.active ? 'text-green-600' : 'text-slate-400'}" title="${mySpace.active ? 'Desactivar' : 'Activar'}">
            <span class="material-symbols-outlined text-sm">${mySpace.active ? 'toggle_on' : 'toggle_off'}</span>
          </button>
          <button data-action="edit" class="p-2 rounded-xl hover:bg-slate-50 text-primary" title="Editar">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
      </div>
    </div>
  `
}

function openEditModal() {
  const modal = document.getElementById('spaceModal')
  if (!mySpace || !modal) return

  populateForm()
  hideFormError()
  modal.classList.remove('hidden')
}

function populateForm() {
  document.getElementById('spaceId').value = mySpace.id || ''
  document.getElementById('spaceName').value = mySpace.name || ''
  document.getElementById('spaceNameEn').value = mySpace.name_en || ''
  document.getElementById('spaceAddress').value = mySpace.address || ''
  document.getElementById('spaceAddressEn').value = mySpace.address_en || ''
  document.getElementById('spaceMunicipality').value = mySpace.municipality || ''
  document.getElementById('spaceGpsLocation').value = mySpace.gps_location || ''
  document.getElementById('spacePhone').value = mySpace.phone || ''
  document.getElementById('spaceEmail').value = mySpace.email || ''
  document.getElementById('spaceActive').checked = mySpace.active

  // Disciplines (convert array to comma-separated string, filter out nulls)
  const disciplines = mySpace.disciplines && mySpace.disciplines.length > 0
    ? mySpace.disciplines.filter(d => d).map(d => d.name || d.discipline_name || '').filter(n => n).join(', ')
    : ''
  document.getElementById('spaceDisciplines').value = disciplines

  // Image
  if (mySpace.image) {
    document.getElementById('imageUrl').value = mySpace.image
    document.getElementById('imagePreviewImg').src = mySpace.image
    document.getElementById('imageUploadZone')?.classList.add('hidden')
    document.getElementById('imagePreview')?.classList.remove('hidden')
  } else {
    document.getElementById('imageUrl').value = ''
    document.getElementById('imageUploadZone')?.classList.remove('hidden')
    document.getElementById('imagePreview')?.classList.add('hidden')
  }
}

async function saveSpace(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveSpaceBtn')
  saveBtn.disabled = true
  saveBtn.textContent = t('form.saving') || 'Guardando...'
  hideFormError()

  const id = document.getElementById('spaceId').value
  const body = {
    name: document.getElementById('spaceName').value.trim(),
    name_en: document.getElementById('spaceNameEn').value.trim() || null,
    address: document.getElementById('spaceAddress').value.trim(),
    address_en: document.getElementById('spaceAddressEn').value.trim() || null,
    phone: document.getElementById('spacePhone').value.trim() || null,
    email: document.getElementById('spaceEmail').value.trim() || null,
    active: document.getElementById('spaceActive').checked,
    image: document.getElementById('imageUrl').value || null
  }

  // Note: municipality, gps_location, and disciplines are read-only for instructors
  // They should NOT be sent in the request body

  try {
    await apiFetch(`/api/spaces/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })

    closeModal()
    await loadMySpace()
  } catch (err) {
    showFormError(err.message || t('errors.saveError'))
  }

  saveBtn.disabled = false
  saveBtn.textContent = t('form.saveButton') || 'Guardar'
}

async function toggleActive() {
  if (!mySpace) return

  try {
    await apiFetch(`/api/spaces/${mySpace.id}`, {
      method: 'PUT',
      body: JSON.stringify({ active: !mySpace.active })
    })
    await loadMySpace()
  } catch (err) {
    alert('Error: ' + err.message)
  }
}

function setupImageUpload() {
  const uploadZone = document.getElementById('imageUploadZone')
  const fileInput = document.getElementById('imageInput')
  const preview = document.getElementById('imagePreview')
  const previewImg = document.getElementById('imagePreviewImg')
  const removeBtn = document.getElementById('removeImageBtn')
  const imageUrl = document.getElementById('imageUrl')

  if (!uploadZone || !fileInput) return

  uploadZone.addEventListener('click', () => fileInput.click())

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona una imagen válida')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no debe superar 5MB')
      return
    }

    try {
      const formData = new FormData()
      formData.append('image', file)

      const data = await apiFetch('/api/upload/image', {
        method: 'POST',
        body: formData,
        headers: {}
      })

      if (data.success && data.data?.url) {
        imageUrl.value = data.data.url
        previewImg.src = data.data.url
        uploadZone?.classList.add('hidden')
        preview?.classList.remove('hidden')
      }
    } catch (err) {
      alert(t('errors.uploadError') + ': ' + err.message)
    }
  })

  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      imageUrl.value = ''
      fileInput.value = ''
      preview?.classList.add('hidden')
      uploadZone?.classList.remove('hidden')
    })
  }
}

function closeModal() {
  const modal = document.getElementById('spaceModal')
  if (modal) modal.classList.add('hidden')
}

function showFormError(msg) {
  const errorEl = document.getElementById('spaceFormError')
  if (errorEl) {
    errorEl.textContent = msg
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
