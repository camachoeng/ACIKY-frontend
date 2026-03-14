import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'
import { formatUserName } from '../utils/formatUserName.js'

let participants = []
let allUsers = []

export async function initAdminOnlineSadhana() {
  const user = await requireAdmin()
  if (!user) return

  await Promise.all([loadParticipants(), loadAllUsers()])

  document.getElementById('participantsList')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="remove"]')
    if (!btn) return
    confirmRemove(parseInt(btn.dataset.id))
  })

  document.getElementById('userPickerList')?.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action="add"]')
    if (!btn) return
    await addParticipant(parseInt(btn.dataset.id))
  })

  document.getElementById('addParticipantBtn')?.addEventListener('click', openAddModal)
  document.getElementById('addModalOverlay')?.addEventListener('click', closeAddModal)
  document.getElementById('cancelAddBtn')?.addEventListener('click', closeAddModal)

  const search = document.getElementById('userPickerSearch')
  if (search) {
    search.addEventListener('input', () => renderUserPicker(search.value))
  }
}

async function loadParticipants() {
  const list = document.getElementById('participantsList')
  if (!list) return

  try {
    const data = await apiFetch('/api/sadhana/participants')
    participants = data.data || []
    renderParticipants()
  } catch (err) {
    list.innerHTML = `<p class="col-span-full text-center text-red-500 text-sm">${t('participants.loadError')}: ${escapeHtml(err.message)}</p>`
  }
}

async function loadAllUsers() {
  try {
    const data = await apiFetch('/api/users')
    allUsers = (data.data || []).sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' })
    )
  } catch {
    // silently fail — user picker will show empty
  }
}

function renderParticipants() {
  const list = document.getElementById('participantsList')
  if (!list) return

  if (participants.length === 0) {
    list.innerHTML = `<p class="col-span-full text-center text-slate-400 text-sm py-8">${t('participants.empty')}</p>`
    return
  }

  list.innerHTML = participants.map(p => {
    const name = escapeHtml(formatUserName(p))
    const img = p.profile_image_url
      ? `<img src="${escapeHtml(p.profile_image_url)}" alt="${name}" class="w-16 h-16 rounded-full object-cover border-2 border-white shadow" onerror="this.onerror=null;this.src='/images/default-avatar.svg'" />`
      : `<div class="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-white shadow"><span class="material-symbols-outlined text-slate-400">person</span></div>`

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-2 text-center">
        ${img}
        <p class="text-xs font-medium text-primary-dark leading-tight">${name}</p>
        <button data-action="remove" data-id="${p.id}" class="text-accent-terracotta hover:text-red-600 transition-colors" title="Eliminar">
          <span class="material-symbols-outlined text-sm">person_remove</span>
        </button>
      </div>`
  }).join('')
}

async function confirmRemove(userId) {
  const participant = participants.find(p => p.id === userId)
  if (!participant) return
  if (!confirm(t('confirm.remove', { name: formatUserName(participant) }))) return

  try {
    await apiFetch(`/api/sadhana/participants/${userId}`, { method: 'DELETE' })
    await loadParticipants()
  } catch (err) {
    alert(t('errors.removeError') + ': ' + err.message)
  }
}

function openAddModal() {
  const modal = document.getElementById('addModal')
  const search = document.getElementById('userPickerSearch')
  if (search) search.value = ''
  renderUserPicker('')
  modal?.classList.remove('hidden')
}

function closeAddModal() {
  document.getElementById('addModal')?.classList.add('hidden')
}

function renderUserPicker(query) {
  const list = document.getElementById('userPickerList')
  if (!list) return

  const participantIds = new Set(participants.map(p => p.id))
  const q = query.trim().toLowerCase()

  let available = allUsers.filter(u => !participantIds.has(u.id))
  if (q) {
    available = available.filter(u => {
      const full = [u.name, u.last_name, u.spiritual_name, u.email].filter(Boolean).join(' ').toLowerCase()
      return full.includes(q)
    })
  }

  if (available.length === 0) {
    list.innerHTML = `<p class="text-center text-slate-400 text-sm py-4">${t('modal.empty')}</p>`
    return
  }

  list.innerHTML = available.map(u => {
    const name = escapeHtml(formatUserName(u))
    const img = u.profile_image_url
      ? `<img src="${escapeHtml(u.profile_image_url)}" alt="${name}" class="w-10 h-10 rounded-full object-cover flex-shrink-0" onerror="this.onerror=null;this.src='/images/default-avatar.svg'" />`
      : `<div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"><span class="material-symbols-outlined text-slate-400 text-sm">person</span></div>`

    return `
      <div class="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
        ${img}
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-primary-dark truncate">${name}</p>
          <p class="text-xs text-slate-400 truncate">${escapeHtml(u.email || '')}</p>
        </div>
        <button data-action="add" data-id="${u.id}" class="flex-shrink-0 p-1.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors">
          <span class="material-symbols-outlined text-sm">add</span>
        </button>
      </div>`
  }).join('')
}

async function addParticipant(userId) {
  try {
    await apiFetch('/api/sadhana/participants', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId })
    })
    await Promise.all([loadParticipants(), loadAllUsers()])
    const search = document.getElementById('userPickerSearch')
    renderUserPicker(search ? search.value : '')
  } catch (err) {
    alert(t('errors.addError') + ': ' + err.message)
  }
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
