import { apiFetch } from './api.js'
import { t, localized } from './i18n.js'

const DEFAULT_AVATAR = '/public/images/default-avatar.svg'

export async function initAbout() {
  const loading = document.getElementById('teamLoading')
  const errorEl = document.getElementById('teamError')
  const container = document.getElementById('teamContainer')
  const emptyEl = document.getElementById('teamEmpty')
  const retryBtn = document.getElementById('teamRetry')

  if (!container) return

  async function loadTeam() {
    loading.classList.remove('hidden')
    errorEl.classList.add('hidden')
    container.classList.add('hidden')
    emptyEl.classList.add('hidden')

    try {
      const data = await apiFetch('/api/users/team')
      loading.classList.add('hidden')

      const instructors = data.data || []
      if (instructors.length === 0) {
        emptyEl.classList.remove('hidden')
        return
      }

      container.innerHTML = instructors.map(instructor => renderTeamCard(instructor)).join('')
      container.classList.remove('hidden')
    } catch (err) {
      loading.classList.add('hidden')
      errorEl.classList.remove('hidden')
    }
  }

  if (retryBtn) retryBtn.addEventListener('click', loadTeam)

  // Listen for language changes to re-render
  window.addEventListener('languageChanged', loadTeam)

  loadTeam()
}

function renderTeamCard(instructor) {
  const imageUrl = instructor.profile_image_url || DEFAULT_AVATAR
  const name = escapeHtml(instructor.username)
  const position = escapeHtml(localized(instructor, 'position'))
  const altText = t('team.photoAlt', { name })

  return `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
      <img
        src="${imageUrl}"
        alt="${altText}"
        class="w-24 h-24 rounded-full object-cover mx-auto mb-4 bg-slate-100"
        loading="lazy"
        onerror="this.src='${DEFAULT_AVATAR}'"
      />
      <h3 class="font-bold text-primary-dark text-sm">${name}</h3>
      <p class="text-xs text-slate-500 mt-1">${position}</p>
    </div>
  `
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
