import { requireInstructor } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

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

  // Hide admin nav for instructors (they shouldn't see the admin panel)
  if (user.role === 'instructor') {
    const adminNav = document.querySelector('nav.bg-primary-dark')
    if (adminNav) adminNav.classList.add('hidden')
  }

  await loadPosts()

  document.getElementById('createPostBtn')
    ?.addEventListener('click', openCreateModal)

  document.getElementById('blogModalOverlay')
    ?.addEventListener('click', closeModal)

  document.getElementById('cancelPostBtn')
    ?.addEventListener('click', closeModal)

  document.getElementById('blogForm')
    ?.addEventListener('submit', savePost)

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
      container.innerHTML = `
        <div class="text-center py-8 text-red-500 text-sm">
          ${t('errors.loadError')}: ${escapeHtml(err.message)}
        </div>`
    }
  }
}

function renderPosts(container) {
  container.innerHTML = allPosts.map(post => {
    const status = post.published ? STATUS_STYLES.published : STATUS_STYLES.draft
    const statusLabel = post.published ? t('status.published') : t('status.draft')
    const date = formatDate(post.created_at)
    const snippet = (post.content || '').substring(0, 100)

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div class="flex-1 min-w-0">
            <h3 class="font-bold text-primary-dark text-base truncate">${escapeHtml(post.title)}</h3>
            <p class="text-slate-400 text-xs mt-1">
              ${escapeHtml(post.author_name || '')} &middot; ${escapeHtml(date)}
            </p>
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

function openCreateModal() {
  const modal = document.getElementById('blogModal')
  const title = document.getElementById('blogModalTitle')
  const form = document.getElementById('blogForm')

  if (title) title.textContent = t('modal.newTitle')
  if (form) form.reset()
  document.getElementById('postId').value = ''
  document.getElementById('postPublished').checked = false
  hideFormError()
  if (modal) modal.classList.remove('hidden')
}

function openEditModal(id) {
  const modal = document.getElementById('blogModal')
  const title = document.getElementById('blogModalTitle')

  const post = allPosts.find(p => p.id === id)
  if (!post) return

  if (title) title.textContent = t('modal.editTitle')
  document.getElementById('postId').value = post.id
  document.getElementById('postTitle').value = post.title || ''
  document.getElementById('postTitleEn').value = post.title_en || ''
  document.getElementById('postContent').value = post.content || ''
  document.getElementById('postContentEn').value = post.content_en || ''
  document.getElementById('postPublished').checked = !!post.published

  hideFormError()
  if (modal) modal.classList.remove('hidden')
}

async function savePost(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('savePostBtn')
  const originalText = saveBtn.textContent
  saveBtn.disabled = true
  saveBtn.textContent = t('modal.saving')
  hideFormError()

  const id = document.getElementById('postId').value
  const title = document.getElementById('postTitle').value.trim()
  const titleEn = document.getElementById('postTitleEn').value.trim()
  const content = document.getElementById('postContent').value.trim()
  const contentEn = document.getElementById('postContentEn').value.trim()
  const published = document.getElementById('postPublished').checked ? 1 : 0

  const body = {
    title,
    title_en: titleEn || null,
    content,
    content_en: contentEn || null,
    published
  }

  try {
    if (id) {
      await apiFetch(`/api/blog/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      })
    } else {
      await apiFetch('/api/blog', {
        method: 'POST',
        body: JSON.stringify(body)
      })
    }

    closeModal()
    await loadPosts()
  } catch (err) {
    showFormError(err.message || t('errors.saveError'))
  }

  saveBtn.disabled = false
  saveBtn.textContent = originalText
}

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
    await apiFetch(`/api/blog/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ published: post.published ? 0 : 1 })
    })
    await loadPosts()
  } catch (err) {
    alert(t('errors.toggleError') + ': ' + err.message)
  }
}

function closeModal() {
  const modal = document.getElementById('blogModal')
  if (modal) modal.classList.add('hidden')
}

function showFormError(msg) {
  const el = document.getElementById('blogFormError')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function hideFormError() {
  const el = document.getElementById('blogFormError')
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
