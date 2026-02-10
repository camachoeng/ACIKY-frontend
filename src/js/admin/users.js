import { requireAdmin, getUser } from '../auth.js'
import { apiFetch } from '../api.js'

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
}

async function loadUsers() {
  const tbody = document.getElementById('usersTableBody')
  if (!tbody) return

  tbody.innerHTML = `
    <tr><td colspan="4" class="px-6 py-8 text-center text-slate-400">
      <span class="material-symbols-outlined animate-spin">progress_activity</span>
    </td></tr>`

  try {
    const data = await apiFetch('/api/users')
    users = data.data || []
    renderUsers(tbody)
  } catch (err) {
    tbody.innerHTML = `
      <tr><td colspan="4" class="px-6 py-8 text-center text-red-500 text-sm">
        Error al cargar usuarios: ${escapeHtml(err.message)}
      </td></tr>`
  }
}

function renderUsers(tbody) {
  if (users.length === 0) {
    tbody.innerHTML = `
      <tr><td colspan="4" class="px-6 py-8 text-center text-slate-400 text-sm">
        No hay usuarios registrados
      </td></tr>`
    return
  }

  const roleColors = {
    admin: 'bg-accent-rose/20 text-accent-rose',
    instructor: 'bg-accent-teal/20 text-accent-teal',
    user: 'bg-slate-100 text-slate-600'
  }

  tbody.innerHTML = users.map(user => {
    const roleClass = roleColors[user.role] || roleColors.user
    return `
      <tr class="border-b border-slate-50 hover:bg-slate-50/50">
        <td class="px-6 py-4 text-sm font-medium text-primary-dark">${escapeHtml(user.username)}</td>
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
    document.getElementById('userUsername').value = user.username
    document.getElementById('userEmail').value = user.email
    document.getElementById('userRole').value = user.role
    document.getElementById('userPassword').value = ''
    if (passwordConfirmInput) passwordConfirmInput.value = ''
    document.getElementById('userPosition').value = user.position || ''
    document.getElementById('userPositionEn').value = user.position_en || ''
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
  const username = document.getElementById('userUsername').value.trim()
  const email = document.getElementById('userEmail').value.trim()
  const password = document.getElementById('userPassword').value
  const passwordConfirm = document.getElementById('userPasswordConfirm').value
  const role = document.getElementById('userRole').value

  const position = document.getElementById('userPosition').value.trim()

  // Validate password confirmation
  if (password && password !== passwordConfirm) {
    showFormError('Las contrasenas no coinciden')
    saveBtn.disabled = false
    saveBtn.textContent = 'Guardar'
    return
  }

  const positionEn = document.getElementById('userPositionEn').value.trim()

  const body = { username, email, role }
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
        showFormError('La contrasena es requerida para nuevos usuarios')
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

  if (!confirm(`Eliminar usuario "${user.username}"?`)) return

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
