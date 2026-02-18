import { apiFetch } from './api.js'
import { localized, t } from './i18n.js'
import { getUser } from './auth.js'
import { formatUserName } from './utils/formatUserName.js'

let allTestimonials = []

export async function initTestimonials() {
  await loadTestimonials()
  setupAuthSection()
  setupEvents()

  window.addEventListener('languageChanged', () => {
    if (allTestimonials.length > 0) {
      renderTestimonials()
    }
  })
}

async function loadTestimonials() {
  const loading = document.getElementById('testimonialsLoading')
  const error = document.getElementById('testimonialsError')
  const empty = document.getElementById('testimonialsEmpty')
  const container = document.getElementById('testimonialsContainer')

  loading?.classList.remove('hidden')
  error?.classList.add('hidden')
  empty?.classList.add('hidden')
  container?.classList.add('hidden')

  try {
    const response = await apiFetch('/api/testimonials/approved')
    allTestimonials = response.data || []
    loading?.classList.add('hidden')

    if (allTestimonials.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderTestimonials()
    }
  } catch {
    loading?.classList.add('hidden')
    error?.classList.remove('hidden')
  }
}

function renderTestimonials() {
  const container = document.getElementById('testimonialsContainer')
  if (!container) return

  container.innerHTML = allTestimonials.map(item => {
    const content = localized(item, 'content') || ''
    const date = formatDate(item.created_at)
    const authorName = formatUserName(item) || item.author_name || ''
    const photoHtml = item.profile_image_url
      ? `<img src="${escapeHtml(item.profile_image_url)}" alt="${escapeHtml(authorName)}" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />`
      : `<div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
           <span class="material-symbols-outlined text-primary text-lg">person</span>
         </div>`

    return `
    <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <span class="material-symbols-outlined text-primary/20 text-3xl">format_quote</span>
      <p class="text-slate-600 text-sm mt-3 leading-relaxed">${escapeHtml(content)}</p>
      <div class="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
        <div class="flex items-center gap-3">
          ${photoHtml}
          <p class="font-semibold text-primary-dark text-sm">${escapeHtml(authorName)}</p>
        </div>
        <time class="text-xs text-slate-400">${escapeHtml(date)}</time>
      </div>
    </div>`
  }).join('')
}

function setupAuthSection() {
  const user = getUser()
  const writeSection = document.getElementById('writeTestimonialSection')
  const loginSection = document.getElementById('loginPromptSection')

  if (user && user.role === 'user') {
    writeSection?.classList.remove('hidden')
    loginSection?.classList.add('hidden')
  } else if (!user) {
    writeSection?.classList.add('hidden')
    loginSection?.classList.remove('hidden')
  } else {
    writeSection?.classList.add('hidden')
    loginSection?.classList.add('hidden')
  }
}

function setupEvents() {
  document.getElementById('testimonialsRetry')
    ?.addEventListener('click', loadTestimonials)

  document.getElementById('testimonialForm')
    ?.addEventListener('submit', handleSubmit)

  const textarea = document.getElementById('testimonialContent')
  const charCount = document.getElementById('testimonialCharCount')
  if (textarea && charCount) {
    textarea.addEventListener('input', () => {
      charCount.textContent = `${textarea.value.length} / 1000`
    })
  }
}

async function handleSubmit(e) {
  e.preventDefault()
  const submitBtn = document.getElementById('testimonialSubmitBtn')
  const originalText = submitBtn.textContent
  submitBtn.disabled = true
  submitBtn.textContent = t('testimonials.submitting')
  hideFormError()

  const content = document.getElementById('testimonialContent').value.trim()
  if (!content) {
    submitBtn.disabled = false
    submitBtn.textContent = originalText
    return
  }

  const body = { content }

  try {
    await apiFetch('/api/testimonials', {
      method: 'POST',
      body: JSON.stringify(body)
    })

    document.getElementById('testimonialForm').classList.add('hidden')
    document.getElementById('testimonialSuccess').classList.remove('hidden')
  } catch (err) {
    showFormError(err.message || t('testimonials.error'))
  }

  submitBtn.disabled = false
  submitBtn.textContent = originalText
}

function showFormError(msg) {
  const el = document.getElementById('testimonialFormError')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function hideFormError() {
  const el = document.getElementById('testimonialFormError')
  if (el) el.classList.add('hidden')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric'
  })
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
