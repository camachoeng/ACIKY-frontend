import { requireInstructor } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'
import { initBlocks, addBlock, getBlocks, render as renderBlocks } from './blogBlocks.js'

let allPosts = []
let currentUser = null

const STATUS_STYLES = {
  published: { bg: 'bg-green-100', text: 'text-green-700', icon: 'visibility' },
  draft: { bg: 'bg-slate-100', text: 'text-slate-500', icon: 'visibility_off' }
}

export async function initAdminBlog() {
  const user = await requireInstructor()
  if (!user) return
  currentUser = user

  if (user.role === 'instructor') {
    const adminNav = document.querySelector('nav.bg-primary-dark')
    if (adminNav) adminNav.classList.add('hidden')
  }

  await loadPosts()

  document.getElementById('createPostBtn')?.addEventListener('click', openCreateModal)
  document.getElementById('blogModalOverlay')?.addEventListener('click', closeModal)
  document.getElementById('cancelPostBtn')?.addEventListener('click', closeModal)
  document.getElementById('blogForm')?.addEventListener('submit', savePost)
  document.getElementById('addTextBlockBtn')?.addEventListener('click', () => addBlock('text'))
  document.getElementById('addImageBlockBtn')?.addEventListener('click', () => addBlock('image'))
  document.getElementById('removePdfBtn')?.addEventListener('click', removePdf)
  document.getElementById('pdfFileInput')?.addEventListener('change', handlePdfUpload)

  const container = document.getElementById('blogContainer')
  container?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const { action, id } = btn.dataset
    const postId = parseInt(id)
    if (action === 'edit') openEditModal(postId)
    if (action === 'delete') confirmDelete(postId)
    if (action === 'toggle-publish') togglePublished(postId)
  })
}

// ─── Load / Render ────────────────────────────────────────────────────────────

async function loadPosts() {
  const container = document.getElementById('blogContainer')
  const loading = document.getElementById('blogLoading')
  const empty = document.getElementById('blogEmpty')

  loading?.classList.remove('hidden')
  container?.classList.add('hidden')
  empty?.classList.add('hidden')

  try {
    const data = await apiFetch('/api/blog/all')
    let posts = data.data || []
    if (currentUser.role === 'instructor') {
      posts = posts.filter(p => p.author_id === currentUser.id)
    }
    allPosts = posts
    loading?.classList.add('hidden')

    if (allPosts.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderPosts(container)
    }
  } catch (err) {
    loading?.classList.add('hidden')
    if (container) {
      container.classList.remove('hidden')
      container.innerHTML = `<div class="text-center py-8 text-red-500 text-sm">${t('errors.loadError')}: ${escapeHtml(err.message)}</div>`
    }
  }
}

function renderPosts(container) {
  container.innerHTML = allPosts.map(post => {
    const status = post.published ? STATUS_STYLES.published : STATUS_STYLES.draft
    const statusLabel = post.published ? t('status.published') : t('status.draft')
    const date = formatDate(post.created_at)

    // Use first text block snippet if available, otherwise fall back to content
    let snippet = ''
    if (post.content_blocks) {
      try {
        const blocks = JSON.parse(post.content_blocks)
        const first = blocks.find(b => b.type === 'text')
        snippet = (first?.content_es || '').substring(0, 100)
      } catch { snippet = '' }
    } else {
      snippet = (post.content || '').substring(0, 100)
    }

    // Show image badge if post has image blocks
    const hasImages = post.content_blocks && (() => {
      try { return JSON.parse(post.content_blocks).some(b => b.type === 'image') } catch { return false }
    })()
    const hasPdf = !!post.pdf_url

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h3 class="font-bold text-primary-dark text-base truncate">${escapeHtml(post.title)}</h3>
              ${hasImages ? `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal text-[10px] font-bold"><span class="material-symbols-outlined text-xs">image</span></span>` : ''}
              ${hasPdf ? `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent-terracotta/10 text-accent-terracotta text-[10px] font-bold"><span class="material-symbols-outlined text-xs">picture_as_pdf</span></span>` : ''}
            </div>
            <p class="text-slate-400 text-xs mt-1">${escapeHtml(post.author_name || '')} &middot; ${escapeHtml(date)}</p>
            ${post.tags ? `<div class="flex flex-wrap gap-1 mt-2">${post.tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => `<span class="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">${escapeHtml(tag)}</span>`).join('')}</div>` : ''}
            <p class="text-slate-500 text-sm mt-2 line-clamp-2">${escapeHtml(snippet)}</p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <button data-action="toggle-publish" data-id="${post.id}"
                    class="px-2 py-1 rounded-full text-xs font-bold ${status.bg} ${status.text} flex items-center gap-1 hover:opacity-80 transition-opacity">
              <span class="material-symbols-outlined text-sm">${status.icon}</span>
              ${escapeHtml(statusLabel)}
            </button>
            <button data-action="edit" data-id="${post.id}" class="p-1 text-primary hover:text-primary-dark transition-colors">
              <span class="material-symbols-outlined text-sm">edit</span>
            </button>
            <button data-action="delete" data-id="${post.id}" class="p-1 text-accent-terracotta hover:text-red-600 transition-colors">
              <span class="material-symbols-outlined text-sm">delete</span>
            </button>
          </div>
        </div>
      </div>`
  }).join('')
}

// ─── Modal ────────────────────────────────────────────────────────────────────

function openCreateModal() {
  const modal = document.getElementById('blogModal')
  const title = document.getElementById('blogModalTitle')
  if (title) title.textContent = t('modal.newTitle')

  document.getElementById('postId').value = ''
  document.getElementById('postTitle').value = ''
  document.getElementById('postTitleEn').value = ''
  document.getElementById('postTags').value = ''
  document.getElementById('postTagsEn').value = ''
  document.getElementById('postPublished').checked = false
  clearPdfUI()
  hideFormError()

  initBlocks([])
  if (modal) modal.classList.remove('hidden')
}

function openEditModal(id) {
  const modal = document.getElementById('blogModal')
  const post = allPosts.find(p => p.id === id)
  if (!post) return

  const title = document.getElementById('blogModalTitle')
  if (title) title.textContent = t('modal.editTitle')

  document.getElementById('postId').value = post.id
  document.getElementById('postTitle').value = post.title || ''
  document.getElementById('postTitleEn').value = post.title_en || ''
  document.getElementById('postTags').value = post.tags || ''
  document.getElementById('postTagsEn').value = post.tags_en || ''
  document.getElementById('postPublished').checked = !!post.published

  // PDF
  clearPdfUI()
  if (post.pdf_url) {
    document.getElementById('pdfUrl').value = post.pdf_url
    document.getElementById('pdfTitle').value = post.pdf_title || ''
    document.getElementById('pdfTitleEn').value = post.pdf_title_en || ''
    showPdfPreview(post.pdf_url)
  }

  // Blocks: parse content_blocks or convert legacy content to single block
  let blocks = []
  if (post.content_blocks) {
    try { blocks = JSON.parse(post.content_blocks) } catch { blocks = [] }
  }
  if (blocks.length === 0) {
    blocks = [{ type: 'text', content_es: post.content || '', content_en: post.content_en || '', url: '', caption_es: '', caption_en: '' }]
  }

  hideFormError()
  initBlocks(blocks)
  if (modal) modal.classList.remove('hidden')
}

function closeModal() {
  const modal = document.getElementById('blogModal')
  if (modal) modal.classList.add('hidden')
}

// ─── Save ─────────────────────────────────────────────────────────────────────

async function savePost(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('savePostBtn')
  const originalText = saveBtn.textContent
  saveBtn.disabled = true
  saveBtn.textContent = t('modal.saving')
  hideFormError()

  const id = document.getElementById('postId').value
  const blocks = getBlocks()

  // Also keep a plain-text `content` field for backwards compat (first text block)
  const firstText = blocks.find(b => b.type === 'text')
  const content = firstText?.content_es || ''
  const contentEn = firstText?.content_en || ''

  const body = {
    title: document.getElementById('postTitle').value.trim(),
    title_en: document.getElementById('postTitleEn').value.trim() || null,
    content,
    content_en: contentEn || null,
    content_blocks: JSON.stringify(blocks),
    tags: document.getElementById('postTags').value.trim() || null,
    tags_en: document.getElementById('postTagsEn').value.trim() || null,
    pdf_url: document.getElementById('pdfUrl').value || null,
    pdf_title: document.getElementById('pdfTitle').value.trim() || null,
    pdf_title_en: document.getElementById('pdfTitleEn').value.trim() || null,
    published: document.getElementById('postPublished').checked ? 1 : 0
  }

  try {
    if (id) {
      await apiFetch(`/api/blog/${id}`, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await apiFetch('/api/blog', { method: 'POST', body: JSON.stringify(body) })
    }
    closeModal()
    await loadPosts()
  } catch (err) {
    showFormError(err.message || t('errors.saveError'))
  }

  saveBtn.disabled = false
  saveBtn.textContent = originalText
}

// ─── PDF upload ───────────────────────────────────────────────────────────────

async function handlePdfUpload(e) {
  const file = e.target.files[0]
  if (!file) return
  e.target.value = ''

  const progress = document.getElementById('pdfUploadProgress')
  const label = document.getElementById('pdfUploadLabel')
  if (progress) progress.classList.remove('hidden')
  if (label) label.classList.add('opacity-50', 'pointer-events-none')

  try {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiFetch('/api/upload/pdf', { method: 'POST', body: formData, headers: {} })
    if (response.data?.url) {
      document.getElementById('pdfUrl').value = response.data.url
      showPdfPreview(response.data.url, file.name)
    }
  } catch {
    // silently fail — user can retry
  }

  if (progress) progress.classList.add('hidden')
  if (label) label.classList.remove('opacity-50', 'pointer-events-none')
}

function showPdfPreview(url, fileName) {
  const preview = document.getElementById('pdfPreview')
  const fileNameEl = document.getElementById('pdfFileName')
  if (!preview || !fileNameEl) return
  // Extract filename from URL if not provided
  const displayName = fileName || decodeURIComponent(url.split('/').pop().split('?')[0])
  fileNameEl.textContent = displayName
  preview.classList.remove('hidden')
}

function removePdf() {
  document.getElementById('pdfUrl').value = ''
  document.getElementById('pdfTitle').value = ''
  document.getElementById('pdfTitleEn').value = ''
  document.getElementById('pdfPreview')?.classList.add('hidden')
}

function clearPdfUI() {
  document.getElementById('pdfUrl').value = ''
  document.getElementById('pdfTitle').value = ''
  document.getElementById('pdfTitleEn').value = ''
  document.getElementById('pdfPreview')?.classList.add('hidden')
}

// ─── Delete / Toggle ──────────────────────────────────────────────────────────

async function confirmDelete(id) {
  const post = allPosts.find(p => p.id === id)
  if (!post) return
  if (!confirm(t('confirm.delete', { title: post.title }))) return
  try {
    await apiFetch(`/api/blog/${id}`, { method: 'DELETE' })
    await loadPosts()
  } catch (err) {
    alert(t('errors.deleteError') + ': ' + err.message)
  }
}

async function togglePublished(id) {
  const post = allPosts.find(p => p.id === id)
  if (!post) return
  try {
    await apiFetch(`/api/blog/${id}`, { method: 'PUT', body: JSON.stringify({ published: post.published ? 0 : 1 }) })
    await loadPosts()
  } catch (err) {
    alert(t('errors.toggleError') + ': ' + err.message)
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function showFormError(msg) {
  const el = document.getElementById('blogFormError')
  if (el) { el.textContent = msg; el.classList.remove('hidden') }
}

function hideFormError() {
  document.getElementById('blogFormError')?.classList.add('hidden')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
