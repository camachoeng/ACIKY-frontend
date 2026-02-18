import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

// Default program structure (3 days, 5 activities each)
const DEFAULT_PROGRAM = [
  {
    day: 1,
    title_es: 'Día 1: Despertar',
    title_en: 'Day 1: Awakening',
    theme_es: 'Conexión con la Energía Interna',
    theme_en: 'Connection with Internal Energy',
    activities: [
      { time: '6:00 AM', title_es: 'Sadhana Colectiva de Apertura', title_en: 'Opening Collective Sadhana', desc_es: 'Práctica matutina que unifica a todos los participantes', desc_en: 'Morning practice that unifies all participants' },
      { time: '9:00 AM', title_es: 'Ceremonias de Bienvenida', title_en: 'Welcome Ceremonies', desc_es: 'Rituales sagrados para recibir a la comunidad', desc_en: 'Sacred rituals to welcome the community' },
      { time: '11:00 AM', title_es: 'Talleres Especializados', title_en: 'Specialized Workshops', desc_es: 'Enseñanzas profundas sobre técnicas avanzadas', desc_en: 'Deep teachings on advanced techniques' },
      { time: '4:00 PM', title_es: 'Kirtan y Música Sagrada', title_en: 'Kirtan and Sacred Music', desc_es: 'Cantos devocionales que elevan la vibración', desc_en: 'Devotional chants that elevate vibration' },
      { time: '7:00 PM', title_es: 'Meditación Grupal de Cierre', title_en: 'Closing Group Meditation', desc_es: 'Integración de las experiencias del día', desc_en: "Integration of the day's experiences" }
    ]
  },
  {
    day: 2,
    title_es: 'Día 2: Transformación',
    title_en: 'Day 2: Transformation',
    theme_es: 'Purificación y Sanación',
    theme_en: 'Purification and Healing',
    activities: [
      { time: '5:30 AM', title_es: 'Sadhana de Sanación', title_en: 'Healing Sadhana', desc_es: 'Práctica específica para liberación emocional', desc_en: 'Specific practice for emotional release' },
      { time: '8:30 AM', title_es: 'Círculos de Compartir', title_en: 'Sharing Circles', desc_es: 'Espacios seguros para expresar y liberar', desc_en: 'Safe spaces to express and release' },
      { time: '10:30 AM', title_es: 'Kriyas de Purificación', title_en: 'Purification Kriyas', desc_es: 'Secuencias intensivas para limpiar el campo áurico', desc_en: 'Intensive sequences to cleanse the auric field' },
      { time: '3:00 PM', title_es: 'Terapias Holísticas', title_en: 'Holistic Therapies', desc_es: 'Sesiones de sanación con diferentes modalidades', desc_en: 'Healing sessions with different modalities' },
      { time: '6:00 PM', title_es: 'Gong Bath Colectivo', title_en: 'Collective Gong Bath', desc_es: 'Baño de sonido para armonización profunda', desc_en: 'Sound bath for deep harmonization' }
    ]
  },
  {
    day: 3,
    title_es: 'Día 3: Integración',
    title_en: 'Day 3: Integration',
    theme_es: 'Manifestación y Compromiso',
    theme_en: 'Manifestation and Commitment',
    activities: [
      { time: '6:00 AM', title_es: 'Sadhana de Manifestación', title_en: 'Manifestation Sadhana', desc_es: 'Práctica para materializar la visión personal', desc_en: 'Practice to materialize personal vision' },
      { time: '9:00 AM', title_es: 'Talleres de Integración', title_en: 'Integration Workshops', desc_es: 'Herramientas para llevar la experiencia a la vida diaria', desc_en: 'Tools to bring the experience into daily life' },
      { time: '12:00 PM', title_es: 'Ceremonia de Compromiso', title_en: 'Commitment Ceremony', desc_es: 'Ritual de dedicación a la práctica personal', desc_en: 'Dedication ritual to personal practice' },
      { time: '4:00 PM', title_es: 'Celebración Comunitaria', title_en: 'Community Celebration', desc_es: 'Fiesta de cierre con música, danza y alegría', desc_en: 'Closing party with music, dance, and joy' },
      { time: '7:00 PM', title_es: 'Círculo de Cierre', title_en: 'Closing Circle', desc_es: 'Bendiciones finales y despedida sagrada', desc_en: 'Final blessings and sacred farewell' }
    ]
  }
]

let programData = []
let activeDay = 0

export async function initAdminFestival() {
  const user = await requireAdmin()
  if (!user) return

  await loadSettings()

  document.getElementById('saveBtn')?.addEventListener('click', saveSettings)

  document.querySelectorAll('.day-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      activeDay = parseInt(btn.dataset.day)
      updateDayTabs()
      renderDayPanel()
    })
  })
}

async function loadSettings() {
  const loading = document.getElementById('festivalLoading')
  const form = document.getElementById('festivalForm')

  try {
    const data = await apiFetch('/api/festival')
    const s = data.data || {}

    // Populate event details
    setVal('topicEs', s.topic_es)
    setVal('topicEn', s.topic_en)
    setVal('datesEs', s.dates_es)
    setVal('datesEn', s.dates_en)
    setVal('durationEs', s.duration_es)
    setVal('durationEn', s.duration_en)
    setVal('locationEs', s.location_es)
    setVal('locationEn', s.location_en)
    setVal('earlyBirdTitleEs', s.early_bird_title_es)
    setVal('earlyBirdTitleEn', s.early_bird_title_en)
    setVal('earlyBirdTextEs', s.early_bird_text_es)
    setVal('earlyBirdTextEn', s.early_bird_text_en)

    // Program data
    programData = (s.program_json && s.program_json.length > 0)
      ? s.program_json
      : JSON.parse(JSON.stringify(DEFAULT_PROGRAM))

    loading?.classList.add('hidden')
    form?.classList.remove('hidden')
    renderDayPanel()
  } catch (err) {
    loading?.classList.add('hidden')
    // Show form with defaults on error
    programData = JSON.parse(JSON.stringify(DEFAULT_PROGRAM))
    form?.classList.remove('hidden')
    renderDayPanel()
  }
}

function updateDayTabs() {
  document.querySelectorAll('.day-tab').forEach((btn, idx) => {
    if (idx === activeDay) {
      btn.classList.add('border-primary', 'text-primary-dark')
      btn.classList.remove('border-transparent', 'text-slate-500')
    } else {
      btn.classList.remove('border-primary', 'text-primary-dark')
      btn.classList.add('border-transparent', 'text-slate-500')
    }
  })
}

function renderDayPanel() {
  const container = document.getElementById('dayPanels')
  if (!container) return

  const day = programData[activeDay]
  if (!day) return

  container.innerHTML = `
    <div class="space-y-4">
      <!-- Day Title & Theme -->
      <div>
        <label class="block text-sm font-medium text-primary-dark mb-1">${t('program.dayTitle')}</label>
        <input type="text" id="dayTitleEs" value="${escapeAttr(day.title_es)}" maxlength="255"
               class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
               placeholder="${t('program.dayTitlePlaceholder')}" />
        <label class="block text-xs font-medium text-accent-teal mt-2 mb-1">${t('program.dayTitleEn')}</label>
        <input type="text" id="dayTitleEn" value="${escapeAttr(day.title_en)}" maxlength="255"
               class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
               placeholder="${t('program.dayTitleEnPlaceholder')}" />
      </div>
      <div>
        <label class="block text-sm font-medium text-primary-dark mb-1">${t('program.dayTheme')}</label>
        <input type="text" id="dayThemeEs" value="${escapeAttr(day.theme_es)}" maxlength="255"
               class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
               placeholder="${t('program.dayThemePlaceholder')}" />
        <label class="block text-xs font-medium text-accent-teal mt-2 mb-1">${t('program.dayThemeEn')}</label>
        <input type="text" id="dayThemeEn" value="${escapeAttr(day.theme_en)}" maxlength="255"
               class="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
               placeholder="${t('program.dayThemeEnPlaceholder')}" />
      </div>

      <!-- Activities -->
      <div class="pt-2 border-t border-slate-100">
        <p class="text-sm font-semibold text-primary-dark mb-4">${t('program.activities')}</p>
        <div id="activitiesContainer" class="space-y-6">
          ${(day.activities || []).map((act, idx) => renderActivityFields(act, idx)).join('')}
        </div>
      </div>

      <!-- Add / Remove Activity -->
      <div class="flex gap-3 pt-2">
        <button type="button" id="addActivityBtn" class="flex items-center gap-1 text-sm text-primary hover:text-primary-dark font-medium">
          <span class="material-symbols-outlined text-sm">add_circle</span>
          <span>${t('program.addActivity')}</span>
        </button>
      </div>
    </div>`

  // Bind day field changes to programData
  bindDayFieldListeners()

  document.getElementById('addActivityBtn')?.addEventListener('click', () => {
    saveDayFieldsToData()
    programData[activeDay].activities.push({ time: '', title_es: '', title_en: '', desc_es: '', desc_en: '' })
    renderDayPanel()
  })
}

function renderActivityFields(act, idx) {
  return `
    <div class="bg-slate-50 rounded-2xl p-4 space-y-3" data-activity="${idx}">
      <div class="flex items-center justify-between mb-1">
        <p class="text-xs font-bold text-slate-500 uppercase">${t('program.activity')} ${idx + 1}</p>
        <button type="button" data-remove="${idx}" class="remove-activity-btn text-accent-terracotta hover:text-red-700">
          <span class="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
      <div>
        <label class="block text-xs font-medium text-slate-600 mb-1">${t('program.activityTime')}</label>
        <input type="text" data-act="${idx}" data-field="time" value="${escapeAttr(act.time)}" maxlength="20"
               class="act-field w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none text-sm"
               placeholder="6:00 AM" />
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">${t('program.activityTitle')} (ES)</label>
          <input type="text" data-act="${idx}" data-field="title_es" value="${escapeAttr(act.title_es)}" maxlength="255"
                 class="act-field w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none text-sm"
                 placeholder="${t('program.activityTitlePlaceholder')}" />
        </div>
        <div>
          <label class="block text-xs font-medium text-accent-teal mb-1">${t('program.activityTitle')} (EN)</label>
          <input type="text" data-act="${idx}" data-field="title_en" value="${escapeAttr(act.title_en)}" maxlength="255"
                 class="act-field w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none text-sm"
                 placeholder="${t('program.activityTitleEnPlaceholder')}" />
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label class="block text-xs font-medium text-slate-600 mb-1">${t('program.activityDesc')} (ES)</label>
          <textarea data-act="${idx}" data-field="desc_es" rows="2" maxlength="500"
                    class="act-field w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none text-sm resize-none"
                    placeholder="${t('program.activityDescPlaceholder')}">${escapeHtml(act.desc_es)}</textarea>
        </div>
        <div>
          <label class="block text-xs font-medium text-accent-teal mb-1">${t('program.activityDesc')} (EN)</label>
          <textarea data-act="${idx}" data-field="desc_en" rows="2" maxlength="500"
                    class="act-field w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary outline-none text-sm resize-none"
                    placeholder="${t('program.activityDescEnPlaceholder')}">${escapeHtml(act.desc_en)}</textarea>
        </div>
      </div>
    </div>`
}

function bindDayFieldListeners() {
  // Remove activity buttons
  document.querySelectorAll('.remove-activity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.dataset.remove)
      saveDayFieldsToData()
      programData[activeDay].activities.splice(idx, 1)
      renderDayPanel()
    })
  })
}

function saveDayFieldsToData() {
  const day = programData[activeDay]
  if (!day) return

  day.title_es = getVal('dayTitleEs')
  day.title_en = getVal('dayTitleEn')
  day.theme_es = getVal('dayThemeEs')
  day.theme_en = getVal('dayThemeEn')

  // Collect activity fields
  document.querySelectorAll('.act-field').forEach(input => {
    const idx = parseInt(input.dataset.act)
    const field = input.dataset.field
    if (!isNaN(idx) && field && day.activities[idx] !== undefined) {
      day.activities[idx][field] = input.value.trim()
    }
  })
}

async function saveSettings() {
  const saveBtn = document.getElementById('saveBtn')
  const saveStatus = document.getElementById('saveStatus')

  // Persist current day edits before saving
  saveDayFieldsToData()

  saveBtn.disabled = true
  if (saveStatus) saveStatus.textContent = t('saving')
  hideError()

  const body = {
    topic_es: getVal('topicEs') || null,
    topic_en: getVal('topicEn') || null,
    dates_es: getVal('datesEs') || null,
    dates_en: getVal('datesEn') || null,
    duration_es: getVal('durationEs') || null,
    duration_en: getVal('durationEn') || null,
    location_es: getVal('locationEs') || null,
    location_en: getVal('locationEn') || null,
    early_bird_title_es: getVal('earlyBirdTitleEs') || null,
    early_bird_title_en: getVal('earlyBirdTitleEn') || null,
    early_bird_text_es: getVal('earlyBirdTextEs') || null,
    early_bird_text_en: getVal('earlyBirdTextEn') || null,
    program_json: programData
  }

  try {
    await apiFetch('/api/festival', { method: 'PUT', body: JSON.stringify(body) })
    if (saveStatus) saveStatus.textContent = t('saved')
    setTimeout(() => { if (saveStatus) saveStatus.textContent = '' }, 3000)
  } catch (err) {
    showError(err.message || t('saveError'))
  }

  saveBtn.disabled = false
}

function showError(msg) {
  const el = document.getElementById('formError')
  if (el) { el.textContent = msg; el.classList.remove('hidden') }
}

function hideError() {
  const el = document.getElementById('formError')
  if (el) el.classList.add('hidden')
}

function getVal(id) {
  return document.getElementById(id)?.value?.trim() || ''
}

function setVal(id, val) {
  const el = document.getElementById(id)
  if (el) el.value = val || ''
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
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
