import { requireAdmin, getUser } from '../auth.js'
import { apiFetch } from '../api.js'
import { formatUserName } from '../utils/formatUserName.js'

let users = []

export async function initAdminUsers() {
  const user = await requireAdmin()
  if (!user) return

  await loadUsers()

  // Create user button
  const createBtn = document.getElementById('createUserBtn')
  if (createBtn) createBtn.addEventListener('click', openCreateModal)

  // Modal overlay close
  const overlay = document.getElementById('userModalOverlay')
  if (overlay) overlay.addEventListener('click', closeModal)

  // Cancel button
  const cancelBtn = document.getElementById('cancelUserBtn')
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  // Form submit
  const form = document.getElementById('userForm')
  if (form) form.addEventListener('submit', saveUser)

  // Toggle position field visibility based on role
  const roleSelect = document.getElementById('userRole')
  if (roleSelect) roleSelect.addEventListener('change', togglePositionField)

  // Show/hide password confirm field when password is entered
  const passwordInput = document.getElementById('userPassword')
  if (passwordInput) {
    passwordInput.addEventListener('input', togglePasswordConfirmField)
  }

  // Search filter
  const searchInput = document.getElementById('usersSearch')
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const tbody = document.getElementById('usersTableBody')
      if (tbody) renderFilteredUsers(tbody, searchInput.value)
    })
  }

  // Table event delegation
  const tbody = document.getElementById('usersTableBody')
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const action = btn.dataset.action
      const id = parseInt(btn.dataset.id)
      if (action === 'edit') openEditModal(id)
      if (action === 'delete') confirmDelete(id)
    })
  }

  // Profile image upload
  const uploadBtn = document.getElementById('userImageUploadBtn')
  const uploadInput = document.getElementById('userImageUpload')
  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener('click', () => uploadInput.click())
    uploadInput.addEventListener('change', handleImageUpload)
  }
}

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody')
  if (!tbody) return

  tbody.innerHTML = `
    <tr><td colspan="5" class="px-6 py-8 text-center text-slate-400">
      <span class="material-symbols-outlined animate-spin">progress_activity</span>
    </td></tr>`

  try {
    const data = await apiFetch('/api/users')
    users = data.data || []
    renderUsers(tbody)
  } catch (err) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="px-6 py-8 text-center text-red-500 text-sm">
        Error al cargar usuarios: ${escapeHtml(err.message)}
      </td></tr>`
  }
}

function renderFilteredUsers(tbody, query) {
  const q = query.trim().toLowerCase()
  const filtered = q
    ? users.filter(u => {
        const full = [u.name, u.last_name, u.spiritual_name, u.email, u.username]
          .filter(Boolean).join(' ').toLowerCase()
        return full.includes(q)
      })
    : users
  renderUsers(tbody, filtered)
}

function renderUsers(tbody, list = users) {
  if (list.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="5" class="px-6 py-8 text-center text-slate-400 text-sm">
        No hay usuarios registrados
      </td></tr>`
    return
  }

  const roleColors = {
    admin: 'bg-accent-rose/20 text-accent-rose',
    instructor: 'bg-accent-teal/20 text-accent-teal',
    user: 'bg-slate-100 text-slate-600'
  }

  tbody.innerHTML = list.map(user => {
    const roleClass = roleColors[user.role] || roleColors.user
    const profileImage = user.profile_image_url
      ? `<img src="${escapeHtml(user.profile_image_url)}" alt="${escapeHtml(formatUserName(user))}" class="w-10 h-10 rounded-full object-cover" />`
      : `<div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><span class="material-symbols-outlined text-slate-400">person</span></div>`

    return `
      <tr class="border-b border-slate-50 hover:bg-slate-50/50">
        <td class="px-6 py-4">${profileImage}</td>
        <td class="px-6 py-4 text-sm font-medium text-primary-dark">${escapeHtml(formatUserName(user))}</td>
        <td class="px-6 py-4 text-sm text-slate-500">${escapeHtml(user.email)}</td>
        <td class="px-6 py-4">
          <span class="px-3 py-1 rounded-full text-xs font-bold ${roleClass}">${user.role}</span>
        </td>
        <td class="px-6 py-4 text-right">
          <button data-action="edit" data-id="${user.id}" class="p-1 text-primary hover:text-primary-dark transition-colors" title="Editar">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button data-action="delete" data-id="${user.id}" class="p-1 text-accent-terracotta hover:text-red-600 transition-colors ml-2" title="Eliminar">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </td>
      </tr>`
  }).join('')
}

function openCreateModal() {
  const modal = document.getElementById('userModal')
  const title = document.getElementById('userModalTitle')
  const form = document.getElementById('userForm')
  const passwordFields = document.getElementById('passwordFields')
  const passwordInput = document.getElementById('userPassword')
  const passwordConfirmFields = document.getElementById('passwordConfirmFields')

  if (title) title.textContent = 'Nuevo Usuario'
  if (form) form.reset()
  document.getElementById('userId').value = ''
  document.getElementById('userProfileImageUrl').value = ''
  const preview = document.getElementById('userProfileImagePreview')
  if (preview) preview.src = '/images/default-avatar.png'
  if (passwordFields) passwordFields.style.display = 'block'
  if (passwordInput) passwordInput.required = true
  if (passwordConfirmFields) passwordConfirmFields.classList.add('hidden')
  togglePositionField()
  hideFormError()
  if (modal) modal.classList.remove('hidden')
}

async function openEditModal(id) {
  const modal = document.getElementById('userModal')
  const title = document.getElementById('userModalTitle')
  const passwordFields = document.getElementById('passwordFields')
  const passwordInput = document.getElementById('userPassword')
  const passwordConfirmFields = document.getElementById('passwordConfirmFields')
  const passwordConfirmInput = document.getElementById('userPasswordConfirm')

  try {
    const data = await apiFetch(`/api/users/${id}`)
    const user = data.data

    if (title) title.textContent = 'Editar Usuario'
    document.getElementById('userId').value = user.id
    document.getElementById('userName').value = user.name || ''
    document.getElementById('userLastName').value = user.last_name || ''
    document.getElementById('userSpiritualName').value = user.spiritual_name || ''
    document.getElementById('userEmail').value = user.email
    document.getElementById('userRole').value = user.role
    document.getElementById('userPassword').value = ''
    if (passwordConfirmInput) passwordConfirmInput.value = ''
    document.getElementById('userPosition').value = user.position || ''
    document.getElementById('userPositionEn').value = user.position_en || ''
    document.getElementById('userProfileImageUrl').value = user.profile_image_url || ''
    const preview = document.getElementById('userProfileImagePreview')
    if (preview) preview.src = user.profile_image_url || '/images/default-avatar.png'
    togglePositionField()

    // Password optional when editing
    if (passwordFields) passwordFields.style.display = 'block'
    if (passwordInput) passwordInput.required = false
    if (passwordConfirmFields) passwordConfirmFields.classList.add('hidden')

    hideFormError()
    if (modal) modal.classList.remove('hidden')
  } catch (err) {
    alert('Error al cargar usuario: ' + err.message)
  }
}

async function saveUser(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveUserBtn')
  saveBtn.disabled = true
  saveBtn.textContent = 'Guardando...'
  hideFormError()

  const id = document.getElementById('userId').value
  const name = document.getElementById('userName').value.trim()
  const last_name = document.getElementById('userLastName').value.trim()
  const spiritual_name = document.getElementById('userSpiritualName').value.trim() || null
  const email = document.getElementById('userEmail').value.trim()
  const password = document.getElementById('userPassword').value
  const passwordConfirm = document.getElementById('userPasswordConfirm').value
  const role = document.getElementById('userRole').value

  const position = document.getElementById('userPosition').value.trim()

  // Validate password confirmation
  if (password && password !== passwordConfirm) {
    showFormError('Las contraseñas no coinciden')
    saveBtn.disabled = false
    saveBtn.textContent = 'Guardar'
    return
  }

  const positionEn = document.getElementById('userPositionEn').value.trim()

  const profile_image_url = document.getElementById('userProfileImageUrl').value.trim() || null

  const body = { name, last_name, spiritual_name, email, role, profile_image_url }
  if (password) body.password = password
  if (role !== 'user') {
    body.position = position || null
    body.position_en = positionEn || null
  }

  try {
    if (id) {
      await apiFetch(`/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      })
    } else {
      if (!password) {
        showFormError('La contraseña es requerida para nuevos usuarios')
        saveBtn.disabled = false
        saveBtn.textContent = 'Guardar'
        return
      }
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(body)
      })
    }

    closeModal()
    await loadUsers()
  } catch (err) {
    showFormError(err.message || 'Error al guardar usuario')
  }

  saveBtn.disabled = false
  saveBtn.textContent = 'Guardar'
}

async function confirmDelete(id) {
  const user = users.find(u => u.id === id)
  if (!user) return

  const currentUser = getUser()
  if (currentUser && currentUser.id === id) {
    alert('No puedes eliminar tu propia cuenta')
    return
  }

  if (!confirm(`Eliminar usuario "${formatUserName(user)}"?`)) return

  try {
    await apiFetch(`/api/users/${id}`, { method: 'DELETE' })
    await loadUsers()
  } catch (err) {
    alert('Error al eliminar: ' + err.message)
  }
}

function togglePositionField() {
  const role = document.getElementById('userRole').value
  const positionField = document.getElementById('positionField')
  if (positionField) {
    positionField.classList.toggle('hidden', role === 'user')
  }
}

function togglePasswordConfirmField() {
  const password = document.getElementById('userPassword').value
  const passwordConfirmFields = document.getElementById('passwordConfirmFields')
  if (passwordConfirmFields) {
    passwordConfirmFields.classList.toggle('hidden', !password)
  }
}

async function handleImageUpload(e) {
  const file = e.target.files[0]
  if (!file) return

  const preview = document.getElementById('userProfileImagePreview')
  const progress = document.getElementById('userUploadProgress')
  const progressBar = document.getElementById('userUploadProgressBar')
  const error = document.getElementById('userUploadError')
  const urlInput = document.getElementById('userProfileImageUrl')

  // Validate file size (5MB max)
  if (file.size > 5 * 1024 * 1024) {
    error.textContent = 'La imagen es muy grande. Tamaño máximo: 5MB'
    error.classList.remove('hidden')
    return
  }

  error.classList.add('hidden')
  progress?.classList.remove('hidden')
  if (progressBar) progressBar.style.width = '50%'

  try {
    const formData = new FormData()
    formData.append('image', file)

    const data = await apiFetch('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {} // Let browser set Content-Type for FormData
    })

    if (progressBar) progressBar.style.width = '100%'
    if (preview) preview.src = data.data.url
    if (urlInput) urlInput.value = data.data.url

    setTimeout(() => progress?.classList.add('hidden'), 1000)
  } catch (err) {
    error.textContent = 'Error al subir imagen: ' + (err.message || 'Error desconocido')
    error.classList.remove('hidden')
    progress?.classList.add('hidden')
  }

  e.target.value = '' // Reset input
}

function closeModal() {
  const modal = document.getElementById('userModal')
  if (modal) modal.classList.add('hidden')
}

function showFormError(msg) {
  const el = document.getElementById('userFormError')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function hideFormError() {
  const el = document.getElementById('userFormError')
  if (el) el.classList.add('hidden')
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
