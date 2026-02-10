import { apiFetch } from './api.js'
import { localized, t } from './i18n.js'

let allPosts = []
let currentPostId = null

export async function initBlog() {
  await loadPosts()
  setupEvents()
  checkHashForPost()

  window.addEventListener('languageChanged', () => {
    if (currentPostId) {
      showPostDetail(currentPostId)
    } else if (allPosts.length > 0) {
      renderPosts()
    }
  })

  window.addEventListener('hashchange', checkHashForPost)
}

function checkHashForPost() {
  const hash = window.location.hash
  const match = hash.match(/^#post-(\d+)$/)
  if (match && allPosts.length > 0) {
    showPostDetail(parseInt(match[1]))
  }
}

async function loadPosts() {
  const loading = document.getElementById('blogLoading')
  const error = document.getElementById('blogError')
  const empty = document.getElementById('blogEmpty')
  const container = document.getElementById('blogContainer')

  loading?.classList.remove('hidden')
  error?.classList.add('hidden')
  empty?.classList.add('hidden')
  container?.classList.add('hidden')

  try {
    const response = await apiFetch('/api/blog')
    allPosts = response.data || []
    loading?.classList.add('hidden')

    if (allPosts.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderPosts()
    }
  } catch {
    loading?.classList.add('hidden')
    error?.classList.remove('hidden')
  }
}

function renderPosts() {
  const container = document.getElementById('blogContainer')
  if (!container) return

  container.innerHTML = allPosts.map(post => {
    const title = localized(post, 'title')
    const content = localized(post, 'content') || ''
    const snippet = content.length > 150 ? content.substring(0, 150) + '...' : content
    const date = formatDate(post.created_at)

    return `
    <div class="blog-card bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
         data-post-id="${post.id}">
      <div class="p-6">
        <h3 class="font-bold text-primary-dark text-lg">${escapeHtml(title)}</h3>
        <div class="flex items-center gap-2 mt-2 text-xs text-slate-400">
          <span>${escapeHtml(post.author_name || '')}</span>
          <span>&middot;</span>
          <time>${escapeHtml(date)}</time>
        </div>
        <p class="text-sm text-slate-500 mt-3 line-clamp-3">${escapeHtml(snippet)}</p>
        <span class="inline-block mt-4 text-primary font-medium text-sm">${t('blog.readMore')} &rarr;</span>
      </div>
    </div>`
  }).join('')
}

function showPostDetail(id) {
  const post = allPosts.find(p => p.id === id)
  if (!post) return

  currentPostId = id
  window.location.hash = `post-${id}`

  const hero = document.getElementById('blogHero')
  const listSection = document.getElementById('blogListSection')
  const detail = document.getElementById('blogDetail')

  hero?.classList.add('hidden')
  listSection?.classList.add('hidden')
  detail?.classList.remove('hidden')

  const title = localized(post, 'title')
  const content = localized(post, 'content') || ''

  document.getElementById('blogDetailTitle').textContent = title
  document.getElementById('blogDetailAuthor').textContent = post.author_name || ''
  document.getElementById('blogDetailDate').textContent = formatDate(post.created_at)

  const contentEl = document.getElementById('blogDetailContent')
  contentEl.innerHTML = escapeHtml(content)
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p class="mb-4">${line}</p>`)
    .join('')

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function showPostList() {
  currentPostId = null
  history.replaceState(null, '', window.location.pathname)

  const hero = document.getElementById('blogHero')
  const listSection = document.getElementById('blogListSection')
  const detail = document.getElementById('blogDetail')

  detail?.classList.add('hidden')
  hero?.classList.remove('hidden')
  listSection?.classList.remove('hidden')
}

function setupEvents() {
  const container = document.getElementById('blogContainer')
  container?.addEventListener('click', (e) => {
    const card = e.target.closest('[data-post-id]')
    if (!card) return
    showPostDetail(parseInt(card.dataset.postId))
  })

  document.getElementById('blogBackBtn')?.addEventListener('click', showPostList)
  document.getElementById('blogRetry')?.addEventListener('click', loadPosts)
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
