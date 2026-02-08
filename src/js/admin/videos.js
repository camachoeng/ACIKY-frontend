import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'

let posturas = []

export async function initAdminVideos() {
  const user = await requireAdmin()
  if (!user) return

  await loadPosturas()

  // Modal overlay close
  const overlay = document.getElementById('videoModalOverlay')
  if (overlay) overlay.addEventListener('click', closeModal)

  // Cancel button
  const cancelBtn = document.getElementById('cancelVideoBtn')
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  // Remove video button
  const removeBtn = document.getElementById('removeVideoBtn')
  if (removeBtn) removeBtn.addEventListener('click', removeVideo)

  // Form submit
  const form = document.getElementById('videoForm')
  if (form) form.addEventListener('submit', saveVideo)

  // YouTube URL change - show video preview
  const youtubeInput = document.getElementById('videoYoutubeUrl')
  if (youtubeInput) {
    youtubeInput.addEventListener('input', debounce(updateVideoPreview, 500))
  }

  // Container event delegation
  const container = document.getElementById('videosContainer')
  if (container) {
    container.addEventListener('click', (e) => {
      const card = e.target.closest('[data-postura-id]')
      if (card) {
        const id = parseInt(card.dataset.posturaId)
        openModal(id)
      }
    })
  }
}

function debounce(fn, ms) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), ms)
  }
}

async function loadPosturas() {
  const container = document.getElementById('videosContainer')
  const loading = document.getElementById('videosLoading')
  const empty = document.getElementById('videosEmpty')

  if (loading) loading.classList.remove('hidden')
  if (container) container.classList.add('hidden')
  if (empty) empty.classList.add('hidden')

  try {
    const data = await apiFetch('/api/gallery/all')
    // Get all items with images (these are posturas that can have videos linked)
    posturas = (data.data || []).filter(item => item.image_url)

    if (loading) loading.classList.add('hidden')

    if (posturas.length === 0) {
      if (empty) empty.classList.remove('hidden')
    } else {
      if (container) {
        container.classList.remove('hidden')
        renderPosturas(container)
      }
    }
  } catch (err) {
    if (loading) loading.classList.add('hidden')
    if (container) {
      container.classList.remove('hidden')
      container.innerHTML = `
        <div class="col-span-full text-center py-8 text-red-500 text-sm">
          Error al cargar: ${escapeHtml(err.message)}
        </div>`
    }
  }
}

function renderPosturas(container) {
  container.innerHTML = posturas.map(item => {
    const hasVideo = !!item.youtube_url
    const thumbnail = item.thumbnail_url || item.image_url

    return `
      <div data-postura-id="${item.id}"
           class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow group">
        <div class="aspect-video bg-slate-100 relative">
          <img src="${escapeHtml(thumbnail)}"
               alt="${escapeHtml(item.alt_text || item.title)}"
               class="w-full h-full object-cover" />
          ${hasVideo ? `
            <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span class="material-symbols-outlined text-white text-4xl">play_circle</span>
            </div>
            <div class="absolute top-2 right-2">
              <span class="px-2 py-1 rounded-full text-xs font-bold bg-red-600 text-white flex items-center gap-1">
                <span class="material-symbols-outlined text-xs">smart_display</span>
                Video
              </span>
            </div>
          ` : `
            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
              <span class="material-symbols-outlined text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity">add_circle</span>
            </div>
            <div class="absolute top-2 right-2">
              <span class="px-2 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-600">
                Sin video
              </span>
            </div>
          `}
        </div>
        <div class="p-4">
          <h3 class="font-bold text-primary-dark text-sm truncate">${escapeHtml(item.title)}</h3>
          <p class="text-slate-400 text-xs mt-1">${item.category}</p>
        </div>
      </div>`
  }).join('')
}

function openModal(id) {
  const modal = document.getElementById('videoModal')
  const item = posturas.find(p => p.id === id)
  if (!item) return

  document.getElementById('posturaId').value = item.id
  document.getElementById('posturaName').textContent = item.title
  document.getElementById('posturaImage').src = item.thumbnail_url || item.image_url
  document.getElementById('posturaImage').alt = item.title
  document.getElementById('videoYoutubeUrl').value = item.youtube_url || ''

  // Show/hide remove button
  const removeBtn = document.getElementById('removeVideoBtn')
  if (removeBtn) {
    removeBtn.classList.toggle('hidden', !item.youtube_url)
  }

  // Update video preview
  updateVideoPreview()
  hideFormError()

  if (modal) modal.classList.remove('hidden')
}

function updateVideoPreview() {
  const url = document.getElementById('videoYoutubeUrl').value.trim()
  const preview = document.getElementById('videoPreview')
  const iframe = document.getElementById('videoIframe')

  if (url && isValidYoutubeUrl(url)) {
    const embedUrl = getYoutubeEmbedUrl(url)
    if (iframe) iframe.src = embedUrl
    if (preview) preview.classList.remove('hidden')
  } else {
    if (iframe) iframe.src = ''
    if (preview) preview.classList.add('hidden')
  }
}

function isValidYoutubeUrl(url) {
  return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/i.test(url)
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

  return videoId ? `https://www.youtube.com/embed/${videoId}` : ''
}

async function saveVideo(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('saveVideoBtn')
  const originalText = saveBtn.textContent
  saveBtn.disabled = true
  saveBtn.textContent = 'Guardando...'
  hideFormError()

  const id = document.getElementById('posturaId').value
  const youtube_url = document.getElementById('videoYoutubeUrl').value.trim()

  // Validate if URL provided
  if (youtube_url && !isValidYoutubeUrl(youtube_url)) {
    showFormError('La URL de YouTube no es válida')
    saveBtn.disabled = false
    saveBtn.textContent = originalText
    return
  }

  try {
    await apiFetch(`/api/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ youtube_url: youtube_url || null })
    })

    closeModal()
    await loadPosturas()
  } catch (err) {
    showFormError(err.message || 'Error al guardar')
  }

  saveBtn.disabled = false
  saveBtn.textContent = originalText
}

async function removeVideo() {
  const id = document.getElementById('posturaId').value
  const item = posturas.find(p => p.id === parseInt(id))
  if (!item) return

  if (!confirm(`¿Desvincular el video de "${item.title}"?`)) return

  try {
    await apiFetch(`/api/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ youtube_url: null })
    })

    closeModal()
    await loadPosturas()
  } catch (err) {
    showFormError(err.message || 'Error al desvincular')
  }
}

function closeModal() {
  const modal = document.getElementById('videoModal')
  const iframe = document.getElementById('videoIframe')
  if (iframe) iframe.src = '' // Stop video
  if (modal) modal.classList.add('hidden')
}

function showFormError(msg) {
  const el = document.getElementById('videoFormError')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function hideFormError() {
  const el = document.getElementById('videoFormError')
  if (el) el.classList.add('hidden')
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
