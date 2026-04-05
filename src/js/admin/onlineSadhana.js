import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'
import { formatUserName } from '../utils/formatUserName.js'

let participants = []
let allUsers = []
let programData = { parts: [] }

const DEFAULT_PROGRAM = {
  parts: [
    {
      title_es: 'Primera Parte',
      title_en: 'First Part',
      steps: [
        { text_es: 'Lectura del pauri 35, 11 veces.', text_en: 'Reading of pauri 35, 11 times.' },
        { text_es: 'Adi mantra y mangala chalan mantra.', text_en: 'Adi mantra and mangala chalan mantra.' },
        { text_es: 'Lectura de lista de sanación y bienestar.', text_en: 'Reading of healing and wellness list.' },
        { text_es: '27 ranas.', text_en: '27 frogs.' },
        { text_es: '1 minuto en arco con respiración de fuego.', text_en: '1 minute in bow pose with breath of fire.' },
        { text_es: '30 segundos de descanso y 30 más en bebé.', text_en: '30 seconds of rest and 30 more in baby pose.' },
        { text_es: 'Sat kriya 3 minutos.', text_en: 'Sat kriya 3 minutes.' },
        { text_es: 'Relajación 3 minutos.', text_en: 'Relaxation 3 minutes.' },
        { text_es: 'Meditación Ek ONG kar largo 31 minutos.', text_en: 'Long Ek ONG kar meditation 31 minutes.' },
        { text_es: 'Eterno sol y 3 sat Nam.', text_en: 'Eternal sun and 3 sat Nam.' },
        { text_es: 'Agradecimiento.', text_en: 'Gratitude.' },
        { text_es: 'Lectura y reflexión del dicho del día.', text_en: 'Reading and reflection of the saying of the day.' }
      ]
    },
    {
      title_es: 'Segunda Parte',
      title_en: 'Second Part',
      steps: [
        { text_es: 'Meditación de la prosperidad. 11 minutos.', text_en: 'Prosperity meditation. 11 minutes.' },
        { text_es: 'Un sat Nam largo.', text_en: 'One long sat Nam.' },
        { text_es: 'Seguir reflexionando o fin.', text_en: 'Continue reflecting or end.' }
      ]
    }
  ]
}

export async function initAdminOnlineSadhana() {
  const user = await requireAdmin()
  if (!user) return

  await Promise.all([loadParticipants(), loadAllUsers(), loadProgram()])

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
  document.getElementById('saveProgramBtn')?.addEventListener('click', saveProgram)
  document.getElementById('addPartBtn')?.addEventListener('click', () => {
    saveProgramToData()
    programData.parts.push({ title_es: '', title_en: '', steps: [] })
    renderProgramEditor()
  })

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

async function loadProgram() {
  try {
    const data = await apiFetch('/api/settings')
    const raw = data.data?.sadhana_program_json
    programData = raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_PROGRAM))
  } catch {
    programData = JSON.parse(JSON.stringify(DEFAULT_PROGRAM))
  }
  renderProgramEditor()
}

let programEditorListenerAttached = false

function renderProgramEditor() {
  const editor = document.getElementById('programEditor')
  if (!editor) return

  editor.innerHTML = programData.parts.map((part, partIdx) => `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4" data-part="${partIdx}">
      <div class="flex items-center justify-between">
        <p class="text-xs font-bold text-slate-400 uppercase">${t('program.partTitle')} ${partIdx + 1}</p>
        <button type="button" data-remove-part="${partIdx}" class="text-accent-terracotta hover:text-red-600 transition-colors">
          <span class="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">${t('program.partTitle')} (ES)</label>
          <input type="text" data-part-field="${partIdx}" data-field="title_es" value="${escapeAttr(part.title_es)}" maxlength="100"
                 class="part-title w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none text-sm" />
        </div>
        <div>
          <label class="block text-xs font-medium text-accent-teal mb-1">${t('program.partTitleEn')}</label>
          <input type="text" data-part-field="${partIdx}" data-field="title_en" value="${escapeAttr(part.title_en)}" maxlength="100"
                 class="part-title w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none text-sm" />
        </div>
      </div>
      <div class="space-y-3" id="stepsContainer-${partIdx}">
        ${(part.steps || []).map((step, stepIdx) => renderStepFields(partIdx, stepIdx, step)).join('')}
      </div>
      <button type="button" data-add-step="${partIdx}" class="flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium">
        <span class="material-symbols-outlined text-sm">add_circle</span>
        <span>${t('program.addStep')}</span>
      </button>
    </div>`).join('')

  if (!programEditorListenerAttached) {
    bindProgramEditorListeners()
    programEditorListenerAttached = true
  }
}

function renderStepFields(partIdx, stepIdx, step) {
  return `
    <div class="flex gap-3 items-start" data-step="${stepIdx}">
      <span class="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-2.5">${stepIdx + 1}</span>
      <div class="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2">
        <input type="text" data-step-field="${partIdx}-${stepIdx}" data-field="text_es" value="${escapeAttr(step.text_es)}" maxlength="300"
               class="step-field px-3 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none text-sm"
               placeholder="${t('program.stepPlaceholder')}" />
        <input type="text" data-step-field="${partIdx}-${stepIdx}" data-field="text_en" value="${escapeAttr(step.text_en)}" maxlength="300"
               class="step-field px-3 py-2 rounded-xl border border-slate-200 focus:border-accent-teal outline-none text-sm"
               placeholder="${t('program.stepEnPlaceholder')}" />
      </div>
      <button type="button" data-remove-step="${partIdx}-${stepIdx}" class="flex-shrink-0 text-accent-terracotta hover:text-red-600 mt-2">
        <span class="material-symbols-outlined text-sm">close</span>
      </button>
    </div>`
}

function bindProgramEditorListeners() {
  const editor = document.getElementById('programEditor')
  if (!editor) return

  editor.addEventListener('click', (e) => {
    const removePartBtn = e.target.closest('[data-remove-part]')
    if (removePartBtn) {
      saveProgramToData()
      programData.parts.splice(parseInt(removePartBtn.dataset.removePart), 1)
      renderProgramEditor()
      return
    }
    const addStepBtn = e.target.closest('[data-add-step]')
    if (addStepBtn) {
      saveProgramToData()
      const partIdx = parseInt(addStepBtn.dataset.addStep)
      programData.parts[partIdx].steps.push({ text_es: '', text_en: '' })
      renderProgramEditor()
      return
    }
    const removeStepBtn = e.target.closest('[data-remove-step]')
    if (removeStepBtn) {
      saveProgramToData()
      const [partIdx, stepIdx] = removeStepBtn.dataset.removeStep.split('-').map(Number)
      programData.parts[partIdx].steps.splice(stepIdx, 1)
      renderProgramEditor()
    }
  })
}

function saveProgramToData() {
  document.querySelectorAll('[data-part-field]').forEach(input => {
    const partIdx = parseInt(input.dataset.partField)
    const field = input.dataset.field
    if (!isNaN(partIdx) && field && programData.parts[partIdx] !== undefined) {
      programData.parts[partIdx][field] = input.value.trim()
    }
  })
  document.querySelectorAll('[data-step-field]').forEach(input => {
    const [partIdx, stepIdx] = input.dataset.stepField.split('-').map(Number)
    const field = input.dataset.field
    if (programData.parts[partIdx]?.steps[stepIdx] !== undefined) {
      programData.parts[partIdx].steps[stepIdx][field] = input.value.trim()
    }
  })
}

async function saveProgram() {
  saveProgramToData()
  const btn = document.getElementById('saveProgramBtn')
  const status = document.getElementById('programSaveStatus')
  if (btn) btn.disabled = true
  if (status) { status.textContent = t('program.saving'); status.classList.remove('hidden') }

  try {
    await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ sadhana_program_json: JSON.stringify(programData) })
    })
    if (status) status.textContent = t('program.saved')
    setTimeout(() => { if (status) status.classList.add('hidden') }, 3000)
  } catch (err) {
    if (status) { status.textContent = t('program.saveError'); status.classList.add('text-red-500') }
  } finally {
    if (btn) btn.disabled = false
  }
}

function escapeAttr(str) {
  if (!str) return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
