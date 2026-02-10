import { apiFetch } from './api.js'
import { localized } from './i18n.js'

let allVideos = []

export async function initVideos() {
  await loadVideos()
  setupVideoModal()

  // Re-render with localized text when language changes (no re-fetch needed)
  window.addEventListener('languageChanged', () => {
    if (allVideos.length > 0) renderVideos()
  })
}

async function loadVideos() {
  const loading = document.getElementById('videosLoading')
  const error = document.getElementById('videosError')
  const empty = document.getElementById('videosEmpty')
  const container = document.getElementById('videosContainer')

  loading?.classList.remove('hidden')
  error?.classList.add('hidden')
  empty?.classList.add('hidden')
  container?.classList.add('hidden')

  try {
    // Fetch all visible gallery items
    const response = await apiFetch('/api/gallery')
    // Filter to only items with youtube_url
    allVideos = (response.data || []).filter(item => item.youtube_url)
    loading?.classList.add('hidden')

    if (allVideos.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderVideos()
    }
  } catch (err) {
    console.error('Error loading videos:', err)
    loading?.classList.add('hidden')
    error?.classList.remove('hidden')
  }
}

function renderVideos() {
  const container = document.getElementById('videosContainer')
  if (!container) return

  container.innerHTML = allVideos.map(item => {
    const title = localized(item, 'title')
    const description = localized(item, 'description')
    const altText = localized(item, 'alt_text') || title
    return `
    <div class="video-card group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
         data-youtube="${escapeAttr(item.youtube_url)}"
         data-title="${escapeAttr(title)}"
         data-description="${escapeAttr(description)}">
      <div class="relative aspect-video overflow-hidden">
        <img src="${escapeAttr(item.thumbnail_url || item.image_url || getYoutubeThumbnail(item.youtube_url))}"
             alt="${escapeAttr(altText)}"
             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
             onerror="this.src='${getYoutubeThumbnail(item.youtube_url)}'" />
        <div class="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <span class="material-symbols-outlined text-white text-6xl drop-shadow-lg group-hover:scale-110 transition-transform">play_circle</span>
        </div>
        <div class="absolute bottom-2 right-2">
          <span class="px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-white flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">smart_display</span>
            YouTube
          </span>
        </div>
      </div>
      <div class="p-4">
        <h3 class="font-bold text-primary-dark text-sm">${escapeHtml(title)}</h3>
        ${description ? `<p class="text-xs text-slate-500 mt-1 line-clamp-2">${escapeHtml(description)}</p>` : ''}
      </div>
    </div>`
  }).join('')
}

function setupVideoModal() {
  const modal = document.getElementById('videoModal')
  const closeBtn = document.getElementById('closeVideo')
  const container = document.getElementById('videosContainer')
  const videoIframe = document.getElementById('videoIframe')
  const videoTitle = document.getElementById('videoTitle')
  const videoDescription = document.getElementById('videoDescription')

  // Open modal on card click
  container?.addEventListener('click', (e) => {
    const card = e.target.closest('.video-card')
    if (!card) return

    const { youtube, title, description } = card.dataset

    videoTitle.textContent = title
    videoDescription.textContent = description
    videoIframe.src = getYoutubeEmbedUrl(youtube)

    modal.classList.remove('hidden')
    modal.classList.add('flex')
    document.body.style.overflow = 'hidden'
  })

  // Close modal
  const closeModal = () => {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    document.body.style.overflow = ''
    videoIframe.src = '' // Stop video
  }

  closeBtn?.addEventListener('click', closeModal)

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeModal()
    }
  })

  // Retry button
  document.getElementById('videosRetry')?.addEventListener('click', loadVideos)
}

function getYoutubeEmbedUrl(url) {
  if (!url) return ''

  let videoId = ''

  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split(/[?&]/)[0]
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('shorts/')[1]?.split(/[?&]/)[0]
  } else if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1])
    videoId = urlParams.get('v')
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1]?.split(/[?&]/)[0]
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : ''
}

function getYoutubeThumbnail(url) {
  if (!url) return ''

  let videoId = ''

  if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split(/[?&]/)[0]
  } else if (url.includes('youtube.com/shorts/')) {
    videoId = url.split('shorts/')[1]?.split(/[?&]/)[0]
  } else if (url.includes('youtube.com/watch')) {
    const urlParams = new URLSearchParams(url.split('?')[1])
    videoId = urlParams.get('v')
  } else if (url.includes('youtube.com/embed/')) {
    videoId = url.split('embed/')[1]?.split(/[?&]/)[0]
  }

  // Use maxresdefault with fallback to hqdefault
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : ''
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}

function escapeAttr(str) {
  if (!str) return ''
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}
