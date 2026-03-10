import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'
import { formatUserName } from '../utils/formatUserName.js'

const DEFAULT_AVATAR = '/public/images/default-avatar.svg'

let teamMembers = []

export async function initAdminTeamOrder() {
  const user = await requireAdmin()
  if (!user) return

  await loadTeam()

  document.getElementById('saveOrderBtn')
    ?.addEventListener('click', saveOrder)

  document.getElementById('teamList')
    ?.addEventListener('click', handleOrderClick)
}

async function loadTeam() {
  const loading = document.getElementById('teamLoading')
  const list = document.getElementById('teamList')
  const empty = document.getElementById('teamEmpty')

  loading?.classList.remove('hidden')
  list?.classList.add('hidden')
  empty?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/users/team')
    teamMembers = data.data || []
    loading?.classList.add('hidden')

    if (teamMembers.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      list?.classList.remove('hidden')
      renderList()
    }
  } catch (err) {
    loading?.classList.add('hidden')
    showError(t('errors.loadError') + ': ' + err.message)
  }
}

function renderList() {
  const list = document.getElementById('teamList')
  if (!list) return

  list.innerHTML = teamMembers.map((instructor, index) => {
    const name = escapeHtml(formatUserName(instructor))
    const imageUrl = instructor.profile_image_url || DEFAULT_AVATAR
    const isFirst = index === 0
    const isLast = index === teamMembers.length - 1

    return `
      <div class="flex items-center gap-3 bg-white rounded-2xl p-3 shadow-sm border border-slate-100" data-index="${index}">
        <span class="text-sm font-bold text-slate-400 w-6 text-center shrink-0">${index + 1}</span>
        <img
          src="${imageUrl}"
          alt="${name}"
          class="w-10 h-10 rounded-full object-cover shrink-0 bg-slate-100"
          onerror="this.src='${DEFAULT_AVATAR}'"
        />
        <span class="flex-1 text-sm font-medium text-primary-dark truncate">${name}</span>
        <div class="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            data-action="up"
            data-index="${index}"
            class="p-1 rounded-lg transition-colors ${isFirst ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-primary'}"
            ${isFirst ? 'disabled' : ''}
            title="Subir">
            <span class="material-symbols-outlined text-sm">arrow_upward</span>
          </button>
          <button
            type="button"
            data-action="down"
            data-index="${index}"
            class="p-1 rounded-lg transition-colors ${isLast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100 hover:text-primary'}"
            ${isLast ? 'disabled' : ''}
            title="Bajar">
            <span class="material-symbols-outlined text-sm">arrow_downward</span>
          </button>
        </div>
      </div>
    `
  }).join('')
}

function handleOrderClick(e) {
  const btn = e.target.closest('[data-action]')
  if (!btn) return

  const { action, index } = btn.dataset
  const i = parseInt(index)

  if (action === 'up' && i > 0) {
    ;[teamMembers[i - 1], teamMembers[i]] = [teamMembers[i], teamMembers[i - 1]]
    renderList()
  } else if (action === 'down' && i < teamMembers.length - 1) {
    ;[teamMembers[i], teamMembers[i + 1]] = [teamMembers[i + 1], teamMembers[i]]
    renderList()
  }
}

async function saveOrder() {
  const btn = document.getElementById('saveOrderBtn')
  const originalHtml = btn?.innerHTML || ''

  if (btn) {
    btn.disabled = true
    btn.innerHTML = `
      <span class="material-symbols-outlined animate-spin text-sm">progress_activity</span>
      <span data-i18n="saving">${t('saving')}</span>
    `
  }

  hideMessages()

  const updates = teamMembers.map((instructor, index) => ({
    id: instructor.id,
    sort_order: index
  }))

  try {
    await apiFetch('/api/users/team/order', {
      method: 'PUT',
      body: JSON.stringify({ updates })
    })
    showSuccess()
  } catch (err) {
    showError(t('errors.saveError') + ': ' + err.message)
  }

  if (btn) {
    btn.disabled = false
    btn.innerHTML = originalHtml
  }
}

function showSuccess() {
  const el = document.getElementById('saveSuccess')
  el?.classList.remove('hidden')
  setTimeout(() => el?.classList.add('hidden'), 3000)
}

function showError(message) {
  const el = document.getElementById('saveError')
  if (el) {
    el.textContent = message
    el.classList.remove('hidden')
  }
}

function hideMessages() {
  document.getElementById('saveSuccess')?.classList.add('hidden')
  document.getElementById('saveError')?.classList.add('hidden')
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
