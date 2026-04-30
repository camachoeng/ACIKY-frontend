import { apiFetch } from './api.js'
import { localized } from './i18n.js'
import { formatUserName } from './utils/formatUserName.js'

const DEFAULT_AVATAR = '/public/images/default-avatar.svg'

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function initMembership() {
  loadTeam()
  window.addEventListener('languageChanged', loadTeam)
}

async function loadTeam() {
  const container = document.getElementById('membershipTeamContainer')
  const loading = document.getElementById('membershipTeamLoading')
  const empty = document.getElementById('membershipTeamEmpty')
  if (!container) return

  loading?.classList.remove('hidden')
  container.classList.add('hidden')
  empty?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/users/team')
    const members = data.data || []

    loading?.classList.add('hidden')

    if (members.length === 0) {
      empty?.classList.remove('hidden')
      return
    }

    container.innerHTML = members.map(renderMemberRow).join('')
    container.classList.remove('hidden')
  } catch {
    loading?.classList.add('hidden')
    empty?.classList.remove('hidden')
  }
}

function renderMemberRow(member) {
  const name = escapeHtml(formatUserName(member))
  const position = escapeHtml(localized(member, 'position'))
  const imageUrl = member.profile_image_url || DEFAULT_AVATAR

  return `
    <div class="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 print:border print:border-slate-200 print:bg-white">
      <img src="${imageUrl}" alt="${name}"
           onerror="this.src='${DEFAULT_AVATAR}'"
           class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
      <div>
        <p class="text-sm text-slate-700 font-semibold">${name}</p>
        ${position ? `<p class="text-xs text-slate-400">${position}</p>` : ''}
      </div>
    </div>`
}
