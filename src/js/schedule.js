import { apiFetch } from './api.js'

// Static color class mappings (full class names for Tailwind scanner)
const COLOR_CLASSES = [
  { bg10: 'bg-primary/10', bg20: 'bg-primary/20', text: 'text-primary' },
  { bg10: 'bg-accent-terracotta/10', bg20: 'bg-accent-terracotta/20', text: 'text-accent-terracotta' },
  { bg10: 'bg-accent-rose/10', bg20: 'bg-accent-rose/20', text: 'text-accent-rose' },
  { bg10: 'bg-accent-teal/10', bg20: 'bg-accent-teal/20', text: 'text-accent-teal' }
]

export async function initSchedule() {
  const loading = document.getElementById('scheduleLoading')
  const errorEl = document.getElementById('scheduleError')
  const container = document.getElementById('scheduleContainer')
  const emptyEl = document.getElementById('scheduleEmpty')
  const retryBtn = document.getElementById('scheduleRetry')

  if (!container) return

  async function loadSchedule() {
    loading.classList.remove('hidden')
    errorEl.classList.add('hidden')
    container.classList.add('hidden')
    emptyEl.classList.add('hidden')

    try {
      const data = await apiFetch('/api/activities?active=true')
      loading.classList.add('hidden')

      if (!data.data || data.data.length === 0) {
        emptyEl.classList.remove('hidden')
        return
      }

      container.innerHTML = data.data.map((activity, i) => renderClassCard(activity, i)).join('')
      container.classList.remove('hidden')
    } catch (err) {
      loading.classList.add('hidden')
      errorEl.classList.remove('hidden')
    }
  }

  if (retryBtn) retryBtn.addEventListener('click', loadSchedule)
  loadSchedule()
}

function renderClassCard(activity, index) {
  const colors = COLOR_CLASSES[index % COLOR_CLASSES.length]
  const { dayAbbr, timeStr } = parseSchedule(activity.schedule)

  return `
    <div class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      <div class="flex items-start gap-4">
        <div class="w-16 h-16 ${colors.bg10} rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
          <span class="text-xs font-bold ${colors.text} uppercase">${dayAbbr}</span>
          <span class="text-xl font-bold text-primary-dark">${timeStr}</span>
        </div>
        <div class="flex-1">
          <h3 class="font-bold text-primary-dark text-lg">${escapeHtml(activity.name)}</h3>
          <p class="text-sm text-slate-500 mb-2">${escapeHtml(activity.location || '')}</p>
          ${activity.instructor_name ? `
          <div class="flex items-center gap-2 mb-3">
            <div class="w-8 h-8 rounded-full ${colors.bg20} flex items-center justify-center">
              <span class="material-symbols-outlined ${colors.text} text-sm">person</span>
            </div>
            <span class="text-sm font-medium text-slate-600">${escapeHtml(activity.instructor_name)}</span>
          </div>` : ''}
          <div class="flex items-center gap-2 text-xs text-slate-400">
            <span class="material-symbols-outlined text-sm">schedule</span>
            <span>${activity.duration || '--'} minutos</span>
            ${activity.difficulty_level ? `
            <span class="mx-2">|</span>
            <span class="material-symbols-outlined text-sm">group</span>
            <span>${formatDifficulty(activity.difficulty_level)}</span>` : ''}
          </div>
        </div>
      </div>
      <div class="mt-4 flex items-center justify-between">
        ${activity.price !== null && activity.price !== undefined ? `
        <span class="text-sm font-bold text-primary-dark">${activity.price > 0 ? '$' + activity.price : 'Gratis'}</span>` : '<span></span>'}
        <a href="https://wa.me/5350759360?text=${encodeURIComponent('Hola, quiero reservar la clase de ' + activity.name + ' con el instructor ' + (activity.instructor_name || '') )}"
           target="_blank"
           class="inline-flex items-center gap-2 bg-primary-dark text-white text-sm font-medium px-4 py-2 rounded-2xl hover:bg-primary transition-colors">
          Reservar
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 01-4.243-1.214l-.252-.149-2.868.852.852-2.868-.149-.252A8 8 0 1112 20z"/></svg>
        </a>
      </div>
    </div>
  `
}

function parseSchedule(schedule) {
  if (!schedule) return { dayAbbr: '---', timeStr: '--:--' }
  const dayMap = {
    'lunes': 'Lun', 'martes': 'Mar', 'miercoles': 'Mie', 'miércoles': 'Mie',
    'jueves': 'Jue', 'viernes': 'Vie', 'sabado': 'Sab', 'sábado': 'Sab', 'domingo': 'Dom'
  }
  const lower = schedule.toLowerCase()
  let dayAbbr = schedule.substring(0, 3)
  for (const [full, abbr] of Object.entries(dayMap)) {
    if (lower.includes(full)) { dayAbbr = abbr; break }
  }
  const timeMatch = schedule.match(/(\d{1,2}:\d{2})/)
  const timeStr = timeMatch ? timeMatch[1] : '--:--'
  return { dayAbbr, timeStr }
}

function formatDifficulty(level) {
  const map = { beginner: 'Principiante', intermediate: 'Intermedio', advanced: 'Avanzado', all: 'Todos los niveles' }
  return map[level] || level
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
