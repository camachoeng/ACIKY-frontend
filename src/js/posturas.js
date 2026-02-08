import { apiFetch } from './api.js'

let allItems = []

export async function initPosturas() {
  await loadPosturas()
  setupLightbox()
}

async function loadPosturas() {
  const loading = document.getElementById('posturasLoading')
  const error = document.getElementById('posturasError')
  const empty = document.getElementById('posturasEmpty')
  const container = document.getElementById('posturasContainer')

  loading?.classList.remove('hidden')
  error?.classList.add('hidden')
  empty?.classList.add('hidden')
  container?.classList.add('hidden')

  try {
    // Fetch only posturas category, visible items
    const response = await apiFetch('/api/gallery?category=posturas')
    // Show all items with images (may also have youtube_url)
    allItems = (response.data || []).filter(item => item.image_url)
    loading?.classList.add('hidden')

    if (allItems.length === 0) {
      empty?.classList.remove('hidden')
    } else {
      container?.classList.remove('hidden')
      renderPosturas()
    }
  } catch (err) {
    console.error('Error loading posturas:', err)
    loading?.classList.add('hidden')
    error?.classList.remove('hidden')
  }
}

function renderPosturas() {
  const container = document.getElementById('posturasContainer')
  if (!container) return

  container.innerHTML = allItems.map(item => `
    <div class="postura-card group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
         data-image="${escapeAttr(item.image_url)}"
         data-title="${escapeAttr(item.title)}"
         data-description="${escapeAttr(item.description || '')}">
      <div class="relative aspect-square overflow-hidden">
        <img src="${escapeAttr(item.thumbnail_url || item.image_url)}"
             alt="${escapeAttr(item.alt_text || item.title)}"
             class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23e2e8f0%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2210%22>Sin imagen</text></svg>'" />
      </div>
      <div class="p-4">
        <h3 class="font-bold text-primary-dark text-sm">${escapeHtml(item.title)}</h3>
        ${item.description ? `<p class="text-xs text-slate-500 mt-1 line-clamp-2">${escapeHtml(item.description)}</p>` : ''}
      </div>
    </div>
  `).join('')
}

function setupLightbox() {
  const modal = document.getElementById('lightboxModal')
  const closeBtn = document.getElementById('closeLightbox')
  const container = document.getElementById('posturasContainer')
  const lightboxImage = document.getElementById('lightboxImage')
  const lightboxTitle = document.getElementById('lightboxTitle')
  const lightboxDescription = document.getElementById('lightboxDescription')

  // Open lightbox on card click
  container?.addEventListener('click', (e) => {
    const card = e.target.closest('.postura-card')
    if (!card) return

    const { image, title, description } = card.dataset

    lightboxTitle.textContent = title
    lightboxDescription.textContent = description
    lightboxImage.src = image
    lightboxImage.alt = title

    modal.classList.remove('hidden')
    modal.classList.add('flex')
    document.body.style.overflow = 'hidden'
  })

  // Close lightbox
  const closeLightbox = () => {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
    document.body.style.overflow = ''
  }

  closeBtn?.addEventListener('click', closeLightbox)

  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeLightbox()
  })

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
      closeLightbox()
    }
  })

  // Retry button
  document.getElementById('posturasRetry')?.addEventListener('click', loadPosturas)
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
