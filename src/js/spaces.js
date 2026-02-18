import { apiFetch } from './api.js'
import { t, getLanguage } from './i18n.js'
import { formatUserName } from './utils/formatUserName.js'

let allSpaces = []
let filteredSpaces = []

export async function initSpaces() {
  await loadSpaces()

  document.getElementById('spacesRetry')
    ?.addEventListener('click', loadSpaces)

  window.addEventListener('languageChanged', () => {
    if (allSpaces.length > 0) {
      populateMunicipalityFilter()
      renderSpaces()
    }
  })
}

async function loadSpaces() {
  const loading = document.getElementById('spacesLoading')
  const error = document.getElementById('spacesError')
  const empty = document.getElementById('spacesEmpty')
  const noResults = document.getElementById('filterNoResults')
  const container = document.getElementById('spacesContainer')

  loading?.classList.remove('hidden')
  error?.classList.add('hidden')
  empty?.classList.add('hidden')
  noResults?.classList.add('hidden')
  container?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/spaces')
    // Public page should only show active spaces, even if user is logged in as instructor/admin
    allSpaces = (data.data || []).filter(s => s.active)
    filteredSpaces = allSpaces
    loading?.classList.add('hidden')

    if (allSpaces.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      populateMunicipalityFilter()
      renderSpaces()
    }
  } catch {
    loading?.classList.add('hidden')
    error?.classList.remove('hidden')
  }
}

function populateMunicipalityFilter() {
  const select = document.getElementById('municipalityFilter')
  if (!select) return

  // Get unique municipalities
  const municipalities = [...new Set(
    allSpaces
      .map(s => s.municipality)
      .filter(Boolean)
  )].sort()

  // Clear existing options except the first one
  while (select.options.length > 1) {
    select.remove(1)
  }

  // Add municipality options
  municipalities.forEach(mun => {
    const option = document.createElement('option')
    option.value = mun
    option.textContent = mun
    select.appendChild(option)
  })

  // Listen for filter changes
  select.removeEventListener('change', handleFilterChange)
  select.addEventListener('change', handleFilterChange)
}

function handleFilterChange(e) {
  const selectedMunicipality = e.target.value

  if (selectedMunicipality) {
    filteredSpaces = allSpaces.filter(s => s.municipality === selectedMunicipality)
  } else {
    filteredSpaces = allSpaces
  }

  renderSpaces()
}

function renderSpaces() {
  const container = document.getElementById('spacesContainer')
  const empty = document.getElementById('spacesEmpty')
  const noResults = document.getElementById('filterNoResults')
  if (!container) return

  const isFiltered = document.getElementById('municipalityFilter')?.value !== ''

  if (filteredSpaces.length === 0) {
    container.classList.add('hidden')
    empty?.classList.add('hidden')
    if (isFiltered) {
      noResults?.classList.remove('hidden')
    } else {
      empty?.classList.remove('hidden')
    }
    return
  }

  empty?.classList.add('hidden')
  noResults?.classList.add('hidden')
  container.classList.remove('hidden')

  const currentLang = getLanguage()
  const isEnglish = currentLang === 'en'

  container.innerHTML = filteredSpaces.map(space => {
    // Use bilingual fields based on current language
    const spaceName = isEnglish && space.name_en ? space.name_en : space.name
    const spaceAddress = isEnglish && space.address_en ? space.address_en : space.address

    const instructorNames = space.instructors && space.instructors.length > 0
      ? space.instructors.filter(i => i).map(i => formatUserName(i)).join(', ')
      : '-'

    const disciplines = space.disciplines && space.disciplines.length > 0
      ? space.disciplines.filter(d => d).map(d => {
          // Use bilingual discipline names
          const disciplineName = isEnglish && d.name_en ? d.name_en : (d.name || d.discipline_name || '')
          return disciplineName
        }).filter(n => n).join(', ')
      : '-'

    // Clean phone number for WhatsApp (remove spaces and dashes)
    const cleanPhone = space.phone ? space.phone.replace(/[\s-]/g, '') : ''

    const hasMultipleInstructors = space.instructors && space.instructors.filter(i => i).length > 1
    const instructorLabel = hasMultipleInstructors ? t('card.instructors') : t('card.instructor')

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
        ${space.image ? `
          <img src="${escapeHtml(space.image)}" alt="${escapeHtml(spaceName)}" class="w-full" />
        ` : ''}

        <div class="p-6">
          <h3 class="font-bold text-lg text-primary-dark mb-4">${escapeHtml(spaceName)}</h3>

          <div class="space-y-2 mb-4">
            <div class="flex items-start gap-2">
              <div class="flex-shrink-0 flex -space-x-1.5 mt-0.5">
                ${space.instructors && space.instructors.filter(i => i).length > 0
                  ? space.instructors.filter(i => i).map(i => i.profile_image_url
                    ? `<img src="${escapeHtml(i.profile_image_url)}" alt="${escapeHtml(formatUserName(i))}" class="w-6 h-6 rounded-full object-cover border border-white" />`
                    : `<div class="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center border border-white"><span class="material-symbols-outlined text-primary" style="font-size:12px">person</span></div>`
                  ).join('')
                  : `<span class="material-symbols-outlined text-primary text-sm">person</span>`}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold text-slate-400">${instructorLabel}</p>
                <p class="text-sm text-slate-600">${escapeHtml(instructorNames)}</p>
              </div>
            </div>

            ${spaceAddress ? `
              <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-primary text-sm mt-0.5">location_on</span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-slate-400">${t('card.address')}</p>
                  <p class="text-sm text-slate-600">${escapeHtml(spaceAddress)}</p>
                </div>
              </div>
            ` : ''}

            ${space.municipality ? `
              <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-primary text-sm mt-0.5">explore</span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-slate-400">${t('card.municipality')}</p>
                  <p class="text-sm text-slate-600">${escapeHtml(space.municipality)}</p>
                </div>
              </div>
            ` : ''}

            ${space.disciplines && space.disciplines.length > 0 ? `
              <div class="flex items-start gap-2">
                <span class="material-symbols-outlined text-primary text-sm mt-0.5">spa</span>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-semibold text-slate-400">${t('card.disciplines')}</p>
                  <p class="text-sm text-slate-600">${escapeHtml(disciplines)}</p>
                </div>
              </div>
            ` : ''}
          </div>

          <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            ${space.email ? `
              <a href="mailto:${escapeHtml(space.email)}"
                 class="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-primary-dark text-white text-xs font-medium rounded-lg hover:bg-primary transition-colors">
                <span class="material-symbols-outlined text-sm">email</span>
                <span>${t('card.emailButton')}</span>
              </a>
            ` : ''}

            ${cleanPhone ? `
              <a href="https://wa.me/${cleanPhone}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-accent-teal text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity">
                <span class="material-symbols-outlined text-sm">chat</span>
                <span>${t('card.whatsappButton')}</span>
              </a>
            ` : ''}

            ${space.gps_location ? `
              <a href="${escapeHtml(space.gps_location)}"
                 target="_blank"
                 rel="noopener noreferrer"
                 class="flex-1 min-w-[120px] inline-flex items-center justify-center gap-1 px-3 py-2 bg-slate-600 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors">
                <span class="material-symbols-outlined text-sm">location_on</span>
                <span>${t('card.locationButton')}</span>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `
  }).join('')
}

function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
