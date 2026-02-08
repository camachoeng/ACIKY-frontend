import { requireAdmin } from '../auth.js'
import { apiFetch, getApiUrl } from '../api.js'

let posturas = []

export async function initAdminPosturas() {
  const user = await requireAdmin()
  if (!user) return

  await loadPosturas()

  // Create button
  const createBtn = document.getElementById('createPosturaBtn')
  if (createBtn) createBtn.addEventListener('click', openCreateModal)

  // Modal overlay close
  const overlay = document.getElementById('posturaModalOverlay')
  if (overlay) overlay.addEventListener('click', closeModal)

  // Cancel button
  const cancelBtn = document.getElementById('cancelPosturaBtn')
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal)

  // Form submit
  const form = document.getElementById('posturaForm')
  if (form) form.addEventListener('submit', savePostura)

  // File upload
  const fileInput = document.getElementById('posturaFileInput')
  if (fileInput) fileInput.addEventListener('change', handleFileSelect)

  // Remove upload button
  const removeBtn = document.getElementById('removeUploadBtn')
  if (removeBtn) removeBtn.addEventListener('click', removeUpload)

  // Drag and drop
  const uploadZone = document.getElementById('uploadZone')
  if (uploadZone) {
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      uploadZone.classList.add('border-primary', 'bg-primary/5')
    })
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('border-primary', 'bg-primary/5')
    })
    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault()
      uploadZone.classList.remove('border-primary', 'bg-primary/5')
      const file = e.dataTransfer.files[0]
      if (file) uploadFile(file)
    })
  }

  // Container event delegation
  const container = document.getElementById('posturasContainer')
  if (container) {
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]')
      if (!btn) return
      const action = btn.dataset.action
      const id = parseInt(btn.dataset.id)
      if (action === 'edit') openEditModal(id)
      if (action === 'delete') confirmDelete(id)
      if (action === 'toggle') toggleVisible(id)
    })
  }
}

async function loadPosturas() {
  const container = document.getElementById('posturasContainer')
  const loading = document.getElementById('posturasLoading')
  const empty = document.getElementById('posturasEmpty')

  if (loading) loading.classList.remove('hidden')
  if (container) container.classList.add('hidden')
  if (empty) empty.classList.add('hidden')

  try {
    // Fetch only posturas category
    const data = await apiFetch('/api/gallery/all?category=posturas')
    // Show all posturas with images (may also have linked youtube_url)
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
          Error al cargar posturas: ${escapeHtml(err.message)}
        </div>`
    }
  }
}

function renderPosturas(container) {
  container.innerHTML = posturas.map(item => {
    const visibilityClass = item.visible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
    const visibilityText = item.visible ? 'Visible' : 'Oculto'
    const visibilityIcon = item.visible ? 'visibility' : 'visibility_off'
    const hasVideo = !!item.youtube_url

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div class="aspect-square bg-slate-100 relative">
          <img src="${escapeHtml(item.thumbnail_url || item.image_url)}"
               alt="${escapeHtml(item.alt_text || item.title)}"
               class="w-full h-full object-cover"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23e2e8f0%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%2394a3b8%22 font-size=%2210%22>Sin imagen</text></svg>'" />
          ${hasVideo ? `<div class="absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-white flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">smart_display</span>
            Video
          </div>` : ''}
        </div>
        <div class="p-4">
          <h3 class="font-bold text-primary-dark text-sm truncate">${escapeHtml(item.title)}</h3>
          <p class="text-slate-500 text-xs mt-1 line-clamp-2">${escapeHtml(item.description || '')}</p>
          <div class="flex items-center justify-between mt-3">
            <button data-action="toggle" data-id="${item.id}"
                    class="px-2 py-1 rounded-full text-xs font-bold ${visibilityClass} flex items-center gap-1 hover:opacity-80 transition-opacity">
              <span class="material-symbols-outlined text-sm">${visibilityIcon}</span>
              ${visibilityText}
            </button>
            <div class="flex gap-1">
              <button data-action="edit" data-id="${item.id}" class="p-1 text-primary hover:text-primary-dark transition-colors" title="Editar">
                <span class="material-symbols-outlined text-sm">edit</span>
              </button>
              <button data-action="delete" data-id="${item.id}" class="p-1 text-accent-terracotta hover:text-red-600 transition-colors" title="Eliminar">
                <span class="material-symbols-outlined text-sm">delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>`
  }).join('')
}

function openCreateModal() {
  const modal = document.getElementById('posturaModal')
  const title = document.getElementById('posturaModalTitle')
  const form = document.getElementById('posturaForm')

  if (title) title.textContent = 'Nueva Postura'
  if (form) form.reset()
  document.getElementById('posturaId').value = ''
  document.getElementById('posturaImageUrl').value = ''
  document.getElementById('posturaThumbnailUrl').value = ''
  document.getElementById('posturaVisible').checked = true
  document.getElementById('posturaDisplayOrder').value = '0'
  resetUploadZone()
  hideFormError()
  if (modal) modal.classList.remove('hidden')
}

function openEditModal(id) {
  const modal = document.getElementById('posturaModal')
  const title = document.getElementById('posturaModalTitle')

  const item = posturas.find(i => i.id === id)
  if (!item) {
    alert('Error al cargar postura')
    return
  }

  if (title) title.textContent = 'Editar Postura'
  document.getElementById('posturaId').value = item.id
  document.getElementById('posturaTitle').value = item.title || ''
  document.getElementById('posturaDescription').value = item.description || ''
  document.getElementById('posturaImageUrl').value = item.image_url || ''
  document.getElementById('posturaThumbnailUrl').value = item.thumbnail_url || ''
  document.getElementById('posturaAltText').value = item.alt_text || ''
  document.getElementById('posturaDisplayOrder').value = item.display_order || 0
  document.getElementById('posturaVisible').checked = !!item.visible

  if (item.image_url) {
    showUploadPreview(item.thumbnail_url || item.image_url)
  } else {
    resetUploadZone()
  }

  hideFormError()
  if (modal) modal.classList.remove('hidden')
}

// File upload functions
function handleFileSelect(e) {
  const file = e.target.files[0]
  if (file) uploadFile(file)
}

async function uploadFile(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    showUploadError('Solo se permiten imágenes JPEG, PNG y WebP')
    return
  }

  if (file.size > 5 * 1024 * 1024) {
    showUploadError('La imagen no puede superar 5MB')
    return
  }

  const placeholder = document.getElementById('uploadPlaceholder')
  const progress = document.getElementById('uploadProgress')
  const preview = document.getElementById('uploadPreview')
  const errorEl = document.getElementById('uploadError')

  placeholder?.classList.add('hidden')
  preview?.classList.add('hidden')
  progress?.classList.remove('hidden')
  errorEl?.classList.add('hidden')

  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await fetch(getApiUrl('/api/upload/gallery'), {
      method: 'POST',
      credentials: 'include',
      body: formData
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Error al subir imagen')
    }

    document.getElementById('posturaImageUrl').value = data.data.url
    document.getElementById('posturaThumbnailUrl').value = data.data.thumbnailUrl || ''
    showUploadPreview(data.data.url)

  } catch (err) {
    console.error('Upload error:', err)
    showUploadError(err.message || 'Error al subir imagen')
    resetUploadZone()
  }
}

function showUploadPreview(imageUrl) {
  const placeholder = document.getElementById('uploadPlaceholder')
  const progress = document.getElementById('uploadProgress')
  const preview = document.getElementById('uploadPreview')
  const previewImg = document.getElementById('uploadPreviewImg')

  placeholder?.classList.add('hidden')
  progress?.classList.add('hidden')
  preview?.classList.remove('hidden')
  if (previewImg) previewImg.src = imageUrl
}

function resetUploadZone() {
  const placeholder = document.getElementById('uploadPlaceholder')
  const progress = document.getElementById('uploadProgress')
  const preview = document.getElementById('uploadPreview')
  const fileInput = document.getElementById('posturaFileInput')
  const errorEl = document.getElementById('uploadError')

  placeholder?.classList.remove('hidden')
  progress?.classList.add('hidden')
  preview?.classList.add('hidden')
  errorEl?.classList.add('hidden')
  if (fileInput) fileInput.value = ''
}

function removeUpload() {
  document.getElementById('posturaImageUrl').value = ''
  document.getElementById('posturaThumbnailUrl').value = ''
  resetUploadZone()
}

function showUploadError(msg) {
  const errorEl = document.getElementById('uploadError')
  if (errorEl) {
    errorEl.textContent = msg
    errorEl.classList.remove('hidden')
  }
}

async function savePostura(e) {
  e.preventDefault()
  const saveBtn = document.getElementById('savePosturaBtn')
  const originalText = saveBtn.textContent
  saveBtn.disabled = true
  saveBtn.textContent = 'Guardando...'
  hideFormError()

  const id = document.getElementById('posturaId').value
  const title = document.getElementById('posturaTitle').value.trim()
  const description = document.getElementById('posturaDescription').value.trim()
  const image_url = document.getElementById('posturaImageUrl').value.trim()
  const thumbnail_url = document.getElementById('posturaThumbnailUrl').value.trim()
  const alt_text = document.getElementById('posturaAltText').value.trim()
  const display_order = parseInt(document.getElementById('posturaDisplayOrder').value) || 0
  const visible = document.getElementById('posturaVisible').checked ? 1 : 0

  if (!image_url) {
    showFormError('Debes subir una imagen')
    saveBtn.disabled = false
    saveBtn.textContent = originalText
    return
  }

  const body = {
    title,
    description: description || null,
    image_url,
    thumbnail_url: thumbnail_url || null,
    // Don't include youtube_url - it's managed in the Videos section
    category: 'posturas', // Fixed category
    alt_text: alt_text || null,
    display_order,
    visible
  }

  try {
    if (id) {
      await apiFetch(`/api/gallery/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      })
    } else {
      await apiFetch('/api/gallery', {
        method: 'POST',
        body: JSON.stringify(body)
      })
    }

    closeModal()
    await loadPosturas()
  } catch (err) {
    showFormError(err.message || 'Error al guardar postura')
  }

  saveBtn.disabled = false
  saveBtn.textContent = originalText
}

async function confirmDelete(id) {
  const item = posturas.find(i => i.id === id)
  if (!item) return

  if (!confirm(`¿Eliminar "${item.title}"?`)) return

  try {
    await apiFetch(`/api/gallery/${id}`, { method: 'DELETE' })
    await loadPosturas()
  } catch (err) {
    alert('Error al eliminar: ' + err.message)
  }
}

async function toggleVisible(id) {
  const item = posturas.find(i => i.id === id)
  if (!item) return

  try {
    await apiFetch(`/api/gallery/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ visible: item.visible ? 0 : 1 })
    })
    await loadPosturas()
  } catch (err) {
    alert('Error al cambiar visibilidad: ' + err.message)
  }
}

function closeModal() {
  const modal = document.getElementById('posturaModal')
  if (modal) modal.classList.add('hidden')
}

function showFormError(msg) {
  const el = document.getElementById('posturaFormError')
  if (el) {
    el.textContent = msg
    el.classList.remove('hidden')
  }
}

function hideFormError() {
  const el = document.getElementById('posturaFormError')
  if (el) el.classList.add('hidden')
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
