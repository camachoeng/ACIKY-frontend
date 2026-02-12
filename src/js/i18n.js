// Language service for bilingual support (Spanish/English)

const STORAGE_KEY = 'aciky_language'
const DEFAULT_LANG = 'es'
const SUPPORTED_LANGS = ['es', 'en']

let currentLang = DEFAULT_LANG
let translations = {}
let commonTranslations = {}

/**
 * Get current language from localStorage or default
 */
export function getLanguage() {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && SUPPORTED_LANGS.includes(stored)) {
    return stored
  }
  return DEFAULT_LANG
}

/**
 * Set language preference
 */
export function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) {
    console.warn(`Unsupported language: ${lang}`)
    return false
  }
  localStorage.setItem(STORAGE_KEY, lang)
  currentLang = lang
  document.documentElement.lang = lang
  return true
}

/**
 * Get the page name from current pathname for loading translations
 */
function getPageName() {
  const path = window.location.pathname
  const base = import.meta.env.BASE_URL

  // Normalize path
  let normalizedPath = path.replace(base, '').replace(/^\/+/, '')

  // Map pathname to translation file name
  const pageMap = {
    '': 'home',
    'index.html': 'home',
    'pages/about.html': 'about',
    'pages/schedule.html': 'schedule',
    'pages/posturas.html': 'posturas',
    'pages/videos.html': 'videos',
    'pages/login.html': 'login',
    'pages/register.html': 'register',
    'pages/verify-email.html': 'verify-email',
    'pages/dashboard.html': 'dashboard',
    'pages/admin/dashboard.html': 'admin-dashboard',
    'pages/admin/users.html': 'admin-users',
    'pages/admin/schedule.html': 'admin-schedule',
    'pages/admin/posturas.html': 'admin-posturas',
    'pages/admin/videos.html': 'admin-videos',
    'pages/admin/blog.html': 'admin-blog',
    'pages/admin/testimonials.html': 'admin-testimonials',
    'pages/admin/golden-routes.html': 'admin-golden-routes',
    'pages/blog.html': 'blog',
    'pages/testimonials.html': 'testimonials',
    'pages/golden-routes.html': 'golden-routes',
    'pages/contact.html': 'contact',
    'pages/instructor/my-classes.html': 'instructor-classes'
  }

  return pageMap[normalizedPath] || 'home'
}

/**
 * Load common translations (header, footer, shared UI)
 */
async function loadCommonTranslations(lang) {
  try {
    const module = await import(`../i18n/${lang}/common.json`)
    return module.default || module
  } catch (err) {
    console.warn(`Failed to load common translations for ${lang}:`, err)
    return {}
  }
}

/**
 * Load page-specific translations
 */
async function loadPageTranslations(lang, pageName) {
  try {
    const module = await import(`../i18n/${lang}/${pageName}.json`)
    return module.default || module
  } catch (err) {
    console.warn(`Failed to load translations for ${pageName} in ${lang}:`, err)
    return {}
  }
}

/**
 * Initialize i18n - load translations for current page
 * Call this early in main.js before page init
 */
export async function initI18n() {
  currentLang = getLanguage()
  document.documentElement.lang = currentLang

  const pageName = getPageName()

  // Load both common and page-specific translations in parallel
  const [common, page] = await Promise.all([
    loadCommonTranslations(currentLang),
    loadPageTranslations(currentLang, pageName)
  ])

  commonTranslations = common
  translations = page

  // Apply translations to DOM
  applyTranslations()

  return { common: commonTranslations, page: translations }
}

/**
 * Get nested object value by dot notation
 */
function getNestedValue(obj, key) {
  return key.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, obj)
}

/**
 * Translate a key - supports dot notation and interpolation
 * @param {string} key - Translation key (e.g., "header.login" or "title")
 * @param {object} params - Optional interpolation params (e.g., { name: "Juan" })
 */
export function t(key, params = {}) {
  // First try page translations, then common
  let value = getNestedValue(translations, key) || getNestedValue(commonTranslations, key)

  if (value === undefined) {
    console.warn(`Missing translation: ${key}`)
    return key
  }

  // Interpolate {{variable}} placeholders
  if (params && typeof value === 'string') {
    Object.keys(params).forEach(param => {
      value = value.replace(new RegExp(`{{${param}}}`, 'g'), params[param])
    })
  }

  return value
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
export function applyTranslations() {
  // Text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    const translated = t(key)
    if (translated !== key) {
      el.textContent = translated
    }
  })

  // Placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder')
    const translated = t(key)
    if (translated !== key) {
      el.placeholder = translated
    }
  })

  // Aria-labels
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria')
    const translated = t(key)
    if (translated !== key) {
      el.setAttribute('aria-label', translated)
    }
  })

  // Title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title')
    const translated = t(key)
    if (translated !== key) {
      el.setAttribute('title', translated)
    }
  })
}

/**
 * Switch language and refresh page translations
 */
export async function switchLanguage(lang) {
  if (!setLanguage(lang)) return false

  const pageName = getPageName()

  const [common, page] = await Promise.all([
    loadCommonTranslations(lang),
    loadPageTranslations(lang, pageName)
  ])

  commonTranslations = common
  translations = page

  applyTranslations()

  // Dispatch event for JS modules to update dynamic content
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }))

  return true
}

/**
 * Get a localized field from an API item (dual-column approach)
 * Falls back to Spanish (default) if English translation is missing
 * @param {object} item - API response object (e.g., activity, gallery item, user)
 * @param {string} field - Base field name (e.g., 'name', 'title', 'position')
 */
export function localized(item, field) {
  if (getLanguage() !== 'es') {
    const value = item[`${field}_en`]
    if (value) return value
  }
  return item[field] || ''
}

/**
 * Get all translations for current page (useful for page modules)
 */
export function getTranslations() {
  return {
    common: commonTranslations,
    page: translations,
    lang: currentLang
  }
}
