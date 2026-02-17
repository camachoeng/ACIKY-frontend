import { requireInstructor } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

let mySessions = []

export async function initInstructorRebirthing() {
  const user = await requireInstructor()
  if (!user) return

  await loadMySessions()

  document.getElementById('sessionModalOverlay')
    ?.addEventListener('click', closeModal)
  document.getElementById('cancelSessionBtn')
    ?.addEventListener('click', closeModal)
  document.getElementById('sessionForm')
    ?.addEventListener('submit', saveSession)

  document.getElementById('sessionsContainer')
    ?.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const id = parseInt(btn.dataset.id)
      if (btn.dataset.action === 'edit') openEditModal(id)
    })
}

async function loadMySessions() {
  const container = document.getElementById('sessionsContainer')
  const loading = document.getElementById('sessionsLoading')
  if (!container) return

  loading?.classList.remove('hidden')
  container.classList.add('hidden')

  try {
    const data = await apiFetch('/api/rebirthing/instructor/my-sessions')
    mySessions = data.data || []
    loading?.classList.add('hidden')
    renderSessions(container)
    container.classList.remove('hidden')
  } catch (err) {
    loading?.classList.add('hidden')
    container.innerHTML = `<p class="text-center text-red-500 text-sm py-8">Error al cargar ceremonias: ${escapeHtml(err.message)}</p>`
    container.classList.remove('hidden')
  }
}

function renderSessions(container) {
  if (mySessions.length === 0) {
    container.innerHTML = `
      <div class="text-center py-12 text-slate-400">
        <span class="material-symbols-outlined text-4xl">spa</span>
        <p class="text-sm mt-2">${t('empty')}</p>
        <p class="text-xs mt-1">${t('emptyHint')}</p>
      </div>`
    return
  }

  container.innerHTML = mySessions.map(s => `
    <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div class="flex items-start gap-4">
        <div class="flex-shrink-0">
          <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <span class="material-symbols-outlined text-primary text-xl">spa</span>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1 flex-wrap">
            <h3 class="font-bold text-primary-dark">${escapeHtml(s.name)}</h3>
            ${s.active
              ? `<span class="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded-full">${t('status.active')}</span>`
              : `<span class="px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded-full">${t('status.inactive')}</span>`}
          </div>
          ${s.date ? `
          <p class="text-xs text-primary mb-1 flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">calendar_month</span>
            ${formatDateTime(s.date)}
          </p>` : ''}
          ${s.address ? `
          <p class="text-xs text-slate-500 mb-1 flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">location_on</span>
            ${escapeHtml(s.address)}
          </p>` : ''}
          ${s.description ? `
          <p class="text-xs text-slate-400 mt-2 line-clamp-2">${escapeHtml(s.description)}</p>` : ''}
        </div>
        <div class="flex-shrink-0">
          <button data-action="edit" data-id="${s.id}" class="p-2 rounded-xl hover:bg-slate-50 text-primary" title="Editar">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
        </div>
      </div>
    </div>
  `).join('')
}

function openEditModal(id) {
  const s = mySessions.find(s => s.id === id)
  if (!s) return

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
    date: datetime,
    active: document.getElementById('sessionActive').checked
  }

  try {
    await apiFetch(`/api/rebirthing/instructor/${id}`, { method: 'PUT', body: JSON.stringify(body) })
    closeModal()
    await loadMySessions()
  } catch (err) {
    showFormError(err.message || 'Error al guardar')
  }

  saveBtn.disabled = false
  saveBtn.textContent = originalText
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

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
