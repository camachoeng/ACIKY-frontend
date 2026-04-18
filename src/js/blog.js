import { apiFetch, API_BASE } from './api.js'
import { localized, t } from './i18n.js'
import { shareContent } from './utils/share.js'
import { formatUserName } from './utils/formatUserName.js'

const POSTS_PER_PAGE = 9

function getAuthorName(post) {
  return formatUserName({
    name: post.author_first_name,
    last_name: post.author_last_name,
    username: post.author_username,
  })
}

let allPosts = []
let filteredPosts = []
let currentPage = 1
let currentPostId = null
let activeTag = null

export async function initBlog() {
  await loadPosts()
  setupEvents()
  checkHashForPost()

  window.addEventListener('languageChanged', () => {
    if (currentPostId) {
      showPostDetail(currentPostId)
    } else if (allPosts.length > 0) {
      activeTag = null
      renderTagFilters()
      applySearch()
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
  document.getElementById('blogSearchBar')?.classList.add('hidden')
  document.getElementById('blogTagFilters')?.classList.add('hidden')
  document.getElementById('blogPagination')?.classList.add('hidden')
  document.getElementById('blogNoResults')?.classList.add('hidden')

  try {
    const response = await apiFetch('/api/blog')
    allPosts = response.data || []
    loading?.classList.add('hidden')

    if (allPosts.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      document.getElementById('blogSearchBar')?.classList.remove('hidden')
      renderTagFilters()
      applySearch()
    }
  } catch {
    loading?.classList.add('hidden')
    error?.classList.remove('hidden')
  }
}

function applySearch() {
  const query = document.getElementById('blogSearch')?.value.trim().toLowerCase() || ''

  filteredPosts = allPosts.filter(post => {
    if (activeTag) {
      const postTags = (localized(post, 'tags') || '').split(',').map(t => t.trim().toLowerCase())
      if (!postTags.includes(activeTag.toLowerCase())) return false
    }
    if (query) {
      const title = (localized(post, 'title') || '').toLowerCase()
      const author = getAuthorName(post).toLowerCase()
      let content = (localized(post, 'content') || '').toLowerCase()
      if (post.content_blocks) {
        try {
          const blocks = JSON.parse(post.content_blocks)
          content = blocks.filter(b => b.type === 'text').map(b => `${b.content_es || ''} ${b.content_en || ''}`).join(' ').toLowerCase()
        } catch { /* keep legacy content */ }
      }
      return title.includes(query) || content.includes(query) || author.includes(query)
    }
    return true
  })

  currentPage = 1
  renderPage()
}

function renderTagFilters() {
  const container = document.getElementById('blogTagFilters')
  if (!container) return

  const tags = [...new Set(
    allPosts
      .flatMap(p => (localized(p, 'tags') || '').split(',').map(t => t.trim()).filter(Boolean))
  )].sort()

  if (tags.length === 0) {
    container.classList.add('hidden')
    return
  }

  container.classList.remove('hidden')
  container.innerHTML = [null, ...tags].map(tag => {
    const isActive = tag === activeTag
    const label = tag === null ? t('blog.allTags') : tag
    return `
      <button
        class="blog-tag-btn px-3 py-1.5 rounded-full text-xs font-medium border transition-colors
               ${isActive
                 ? 'bg-primary-dark text-white border-primary-dark'
                 : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'}"
        data-tag="${tag === null ? '' : escapeHtml(tag)}">
        ${escapeHtml(label)}
      </button>`
  }).join('')

  container.addEventListener('click', handleTagClick, { once: true })
}

function handleTagClick(e) {
  const btn = e.target.closest('.blog-tag-btn')
  const container = document.getElementById('blogTagFilters')
  container?.addEventListener('click', handleTagClick, { once: true })
  if (!btn) return

  activeTag = btn.dataset.tag || null
  renderTagFilters()
  applySearch()
}

function renderPage() {
  const container = document.getElementById('blogContainer')
  const noResults = document.getElementById('blogNoResults')
  const pagination = document.getElementById('blogPagination')
  if (!container) return

  if (filteredPosts.length === 0) {
    container.classList.add('hidden')
    pagination?.classList.add('hidden')
    noResults?.classList.remove('hidden')
    return
  }

  noResults?.classList.add('hidden')

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
  const start = (currentPage - 1) * POSTS_PER_PAGE
  const pagePosts = filteredPosts.slice(start, start + POSTS_PER_PAGE)

  container.innerHTML = pagePosts.map(post => renderCard(post)).join('')
  container.classList.remove('hidden')

  if (totalPages > 1) {
    const pageInfo = document.getElementById('blogPageInfo')
    const prevBtn = document.getElementById('blogPrevBtn')
    const nextBtn = document.getElementById('blogNextBtn')

    if (pageInfo) pageInfo.textContent = `${t('blog.page')} ${currentPage} ${t('blog.of')} ${totalPages}`
    if (prevBtn) prevBtn.disabled = currentPage === 1
    if (nextBtn) nextBtn.disabled = currentPage === totalPages
    pagination?.classList.remove('hidden')
  } else {
    pagination?.classList.add('hidden')
  }
}

function getPostImage(post) {
  if (post.content_blocks) {
    try {
      const blocks = JSON.parse(post.content_blocks)
      const imgBlock = blocks.find(b => b.type === 'image')
      if (imgBlock?.url) return imgBlock.url
    } catch { /* fall through */ }
  }
  return null
}

function getPostSnippet(post) {
  if (post.content_blocks) {
    try {
      const blocks = JSON.parse(post.content_blocks)
      const lang = document.documentElement.lang === 'en' ? 'en' : 'es'
      const first = blocks.find(b => b.type === 'text')
      const text = (lang === 'en' && first?.content_en ? first.content_en : first?.content_es) || ''
      return text.length > 150 ? text.substring(0, 150) + '...' : text
    } catch { /* fall through */ }
  }
  const content = localized(post, 'content') || ''
  return content.length > 150 ? content.substring(0, 150) + '...' : content
}

function renderCard(post) {
  const title = localized(post, 'title')
  const snippet = getPostSnippet(post)
  const date = formatDate(post.created_at)
  const imageUrl = getPostImage(post)

  return `
    <div class="blog-card bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
         data-post-id="${post.id}">
      ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}" class="w-full h-44 object-cover" onerror="this.onerror=null;this.style.display='none'" />` : ''}
      <div class="p-6">
        <h3 class="font-bold text-primary-dark text-lg">${escapeHtml(title)}</h3>
        <div class="flex items-center gap-2 mt-2 text-xs text-slate-400">
          ${post.author_profile_image_url
            ? `<img src="${escapeHtml(post.author_profile_image_url)}" alt="${escapeHtml(getAuthorName(post))}" class="w-5 h-5 rounded-full object-cover flex-shrink-0" />`
            : `<span class="material-symbols-outlined text-xs">person</span>`}
          <span>${escapeHtml(getAuthorName(post))}${post.author_spiritual_name ? ` · <em class="not-italic text-primary-dark/60">${escapeHtml(post.author_spiritual_name)}</em>` : ''}</span>
          <span>&middot;</span>
          <time>${escapeHtml(date)}</time>
        </div>
        <p class="text-sm text-slate-500 mt-3 line-clamp-3">${escapeHtml(snippet)}</p>
        <div class="flex items-center justify-between mt-4">
          <span class="text-primary font-medium text-sm">${t('blog.readMore')} &rarr;</span>
          <button class="blog-share-btn p-1.5 rounded-full hover:bg-primary/10 text-slate-400 hover:text-primary transition-colors"
                  data-share-id="${post.id}"
                  data-share-image="${escapeHtml(imageUrl || '')}"
                  title="${escapeHtml(t('common.share'))}">
            <span class="material-symbols-outlined text-base">share</span>
          </button>
        </div>
      </div>
    </div>`
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
  const authorEl = document.getElementById('blogDetailAuthor')
  authorEl.textContent = getAuthorName(post)
  if (post.author_spiritual_name) {
    authorEl.innerHTML = `${escapeHtml(getAuthorName(post))} <em class="not-italic text-primary-dark/60 text-xs">${escapeHtml(post.author_spiritual_name)}</em>`
  }
  document.getElementById('blogDetailDate').textContent = formatDate(post.created_at)

  const authorImg = document.getElementById('blogDetailAuthorImg')
  const authorIcon = document.getElementById('blogDetailAuthorIcon')
  if (authorImg && authorIcon) {
    if (post.author_profile_image_url) {
      authorImg.src = post.author_profile_image_url
      authorImg.alt = getAuthorName(post)
      authorImg.classList.remove('hidden')
      authorIcon.classList.add('hidden')
    } else {
      authorImg.classList.add('hidden')
      authorIcon.classList.remove('hidden')
    }
  }

  const bioEl = document.getElementById('blogDetailAuthorBio')
  if (bioEl) {
    const lang = document.documentElement.lang === 'en' ? 'en' : 'es'
    const bio = (lang === 'en' && post.author_bio_en ? post.author_bio_en : post.author_bio) || ''
    if (bio) {
      bioEl.textContent = bio
      bioEl.classList.remove('hidden')
    } else {
      bioEl.classList.add('hidden')
    }
  }

  const contentEl = document.getElementById('blogDetailContent')
  if (post.content_blocks) {
    try {
      const blocks = JSON.parse(post.content_blocks)
      contentEl.innerHTML = blocks.map(block => renderContentBlock(block, post)).join('')
    } catch {
      contentEl.innerHTML = renderPlainText(content)
    }
  } else {
    contentEl.innerHTML = renderPlainText(content)
  }

  // PDF attachment
  const pdfEl = document.getElementById('blogDetailPdf')
  if (pdfEl) {
    if (post.pdf_url) {
      const pdfTitle = localized(post, 'pdf_title') || t('blog.downloadPdf')
      pdfEl.classList.remove('hidden')
      pdfEl.innerHTML = `
        <a href="${escapeHtml(post.pdf_url)}" target="_blank" rel="noopener noreferrer"
           class="inline-flex items-center gap-3 px-5 py-3 bg-accent-terracotta/10 border border-accent-terracotta/30 rounded-2xl hover:bg-accent-terracotta/20 transition-colors">
          <span class="material-symbols-outlined text-accent-terracotta text-2xl">picture_as_pdf</span>
          <div>
            <p class="text-xs font-semibold text-slate-500 uppercase tracking-wide">${t('blog.attachment')}</p>
            <p class="text-sm font-bold text-primary-dark">${escapeHtml(pdfTitle)}</p>
          </div>
          <span class="material-symbols-outlined text-slate-400 ml-2">download</span>
        </a>`
    } else {
      pdfEl.classList.add('hidden')
      pdfEl.innerHTML = ''
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function renderPlainText(content) {
  return escapeHtml(content)
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p class="mb-4">${line}</p>`)
    .join('')
}

function renderContentBlock(block, post) {
  if (block.type === 'image') {
    const caption = localized({ caption: block.caption_es, caption_en: block.caption_en }, 'caption')
    return `
      <figure class="my-6">
        <img src="${escapeHtml(block.url)}" alt="${escapeHtml(caption)}"
             class="w-full rounded-2xl shadow-sm" onerror="this.onerror=null;this.style.display='none'" />
        ${caption ? `<figcaption class="text-xs text-slate-400 text-center mt-2">${escapeHtml(caption)}</figcaption>` : ''}
      </figure>`
  }
  // Text block
  const lang = document.documentElement.lang === 'en' ? 'en' : 'es'
  const text = (lang === 'en' && block.content_en ? block.content_en : block.content_es) || ''
  return text
    .split('\n')
    .filter(line => line.trim())
    .map(line => `<p class="mb-4">${escapeHtml(line)}</p>`)
    .join('')
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
    const shareBtn = e.target.closest('.blog-share-btn')
    if (shareBtn) {
      const id = parseInt(shareBtn.dataset.shareId)
      const post = allPosts.find(p => p.id === id)
      if (post) {
        const title = localized(post, 'title')
        const url = `${API_BASE}/share/blog/${id}`
        shareContent({ title, text: title, url })
      }
      return
    }

    const card = e.target.closest('[data-post-id]')
    if (!card) return
    showPostDetail(parseInt(card.dataset.postId))
  })

  document.getElementById('blogBackBtn')?.addEventListener('click', showPostList)
  document.getElementById('blogRetry')?.addEventListener('click', loadPosts)

  document.getElementById('blogShareBtn')?.addEventListener('click', () => {
    if (!currentPostId) return
    const post = allPosts.find(p => p.id === currentPostId)
    if (!post) return
    const title = localized(post, 'title')
    const url = `${API_BASE}/share/blog/${currentPostId}`
    shareContent({ title, text: title, url })
  })

  document.getElementById('blogSearch')?.addEventListener('input', applySearch)

  document.getElementById('blogPrevBtn')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--
      renderPage()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })

  document.getElementById('blogNextBtn')?.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE)
    if (currentPage < totalPages) {
      currentPage++
      renderPage()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })
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
