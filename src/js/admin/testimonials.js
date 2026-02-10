import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

let allTestimonials = []

const STATUS_STYLES = {
  approved: { bg: 'bg-green-100', text: 'text-green-700', icon: 'check_circle' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: 'pending' }
}

export async function initAdminTestimonials() {
  const user = await requireAdmin()
  if (!user) return

  await loadTestimonials()

  document.getElementById('testimonialModalOverlay')
    ?.addEventListener('click', closeModal)

  document.getElementById('cancelTestimonialBtn')
    ?.addEventListener('click', closeModal)

  document.getElementById('testimonialForm')
    ?.addEventListener('submit', saveTestimonial)

  const container = document.getElementById('testimonialsContainer')
  container?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const { action, id } = btn.dataset
    const testimonialId = parseInt(id)
    if (action === 'edit') openEditModal(testimonialId)
    if (action === 'delete') confirmDelete(testimonialId)
    if (action === 'toggle-approve') toggleApproved(testimonialId)
    if (action === 'toggle-featured') toggleFeatured(testimonialId)
  })

  window.addEventListener('languageChanged', () => {
    if (container && allTestimonials.length > 0) {
      renderTestimonials(container)
    }
  })
}

async function loadTestimonials() {
  const container = document.getElementById('testimonialsContainer')
  const loading = document.getElementById('testimonialsLoading')
  const empty = document.getElementById('testimonialsEmpty')

  loading?.classList.remove('hidden')
  container?.classList.add('hidden')
  empty?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/testimonials/all')
    allTestimonials = data.data || []

    loading?.classList.add('hidden')

    if (allTestimonials.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderTestimonials(container)
    }
  } catch (err) {
    loading?.classList.add('hidden')
    if (container) {
      container.classList.remove('hidden')
      container.innerHTML = `
        <div class="text-center py-8 text-red-500 text-sm">
          ${t('errors.loadError')}: ${escapeHtml(err.message)}
        </div>`
    }
  }
}

function renderTestimonials(container) {
  container.innerHTML = allTestimonials.map(item => {
    const status = item.approved ? STATUS_STYLES.approved : STATUS_STYLES.pending
    const statusLabel = item.approved ? t('status.approved') : t('status.pending')
    const date = formatDate(item.created_at)
    const snippet = (item.content || item.content_en || '').substring(0, 120)
    const isFeatured = item.featured

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <p class="text-slate-500 text-sm line-clamp-2">${escapeHtml(snippet)}</p>
            <p class="text-slate-400 text-xs mt-2">
              ${escapeHtml(item.author_name || '')} &middot; ${escapeHtml(date)}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button data-action="toggle-featured" data-id="${item.id}"
                    class="p-1 transition-colors ${isFeatured ? 'text-amber-500 hover:text-amber-600' : 'text-slate-300 hover:text-amber-500'}">
              <span class="material-symbols-outlined text-sm">${isFeatured ? 'star' : 'star_outline'}</span>
            </button>
            <button data-action="toggle-approve" data-id="${item.id}"
                    class="px-2 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text} flex items-center gap-1 hover:opacity-80 transition-opacity">
              <span class="material-symbols-outlined text-sm">${status.icon}</span>
              ${escapeHtml(statusLabel)}
            </button>
            <button data-action="edit" data-id="${item.id}" class="p-1 text-primary hover:text-primary-dark transition-colors">
              <span class="material-symbols-outlined text-sm">edit</span>
            </button>
            <button data-action="delete" data-id="${item.id}" class="p-1 text-accent-terracotta hover:text-red-600 transition-colors">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>`
  }).join('')
}

function openEditModal(id) {
  const modal = document.getElementById('testimonialModal')
  const item = allTestimonials.find(t => t.id === id)
  if (!item) return

  document.getElementById('testimonialId').value = item.id
  document.getElementById('testimonialContentEs').value = item.content || ''
  document.getElementById('testimonialContentEn').value = item.content_en || ''
  document.getElementById('testimonialApproved').checked = !!item.approved

  hideFormError()
  if (modal) modal.classList.remove('hidden')
}

async function saveTestimonial(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveTestimonialBtn')
  const originalText = saveBtn.textContent
  saveBtn.disabled = true
  saveBtn.textContent = t('modal.saving')
  hideFormError()

  const id = document.getElementById('testimonialId').value
  const content = document.getElementById('testimonialContentEs').value.trim()
  const contentEn = document.getElementById('testimonialContentEn').value.trim()
  const approved = document.getElementById('testimonialApproved').checked ? 1 : 0

  const body = {
    content: content || null,
    content_en: contentEn || null,
    approved
  }

  try {
    await apiFetch(`/api/testimonials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    })

    closeModal()
    await loadTestimonials()
  } catch (err) {
    showFormError(err.message || t('errors.saveError'))
  }

  saveBtn.disabled = false
  saveBtn.textContent = originalText
}

async function toggleApproved(id) {
  const item = allTestimonials.find(t => t.id === id)
  if (!item) return

  try {
    await apiFetch(`/api/testimonials/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ approved: item.approved ? 0 : 1 })
    })
    await loadTestimonials()
  } catch (err) {
    alert(t('errors.toggleError') + ': ' + err.message)
  }
}

async function toggleFeatured(id) {
  try {
    await apiFetch(`/api/testimonials/${id}/featured`, {
      method: 'PUT'
    })
    await loadTestimonials()
  } catch (err) {
    alert(t('errors.toggleError') + ': ' + err.message)
  }
}

async function confirmDelete(id) {
  const item = allTestimonials.find(t => t.id === id)
  if (!item) return

  if (!confirm(t('confirm.delete', { author: item.author_name }))) return

  try {
    await apiFetch(`/api/testimonials/${id}`, { method: 'DELETE' })
    await loadTestimonials()
  } catch (err) {
    alert(t('errors.deleteError') + ': ' + err.message)
  }
}

function closeModal() {
  const modal = document.getElementById('testimonialModal')
  if (modal) modal.classList.add('hidden')
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
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
