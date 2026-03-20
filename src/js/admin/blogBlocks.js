import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

let blocks = []
let blockCounter = 0
let listenerAttached = false

// ─── Public API ───────────────────────────────────────────────────────────────

export function initBlocks(initialBlocks = []) {
  blockCounter = 0
  listenerAttached = false
  if (initialBlocks.length > 0) {
    blocks = initialBlocks.map(b => ({ ...b, id: ++blockCounter }))
  } else {
    blocks = [makeBlock('text')]
  }
  render()
}

export function addBlock(type) {
  syncAllFromDOM()
  blocks.push(makeBlock(type))
  render()
}

export function getBlocks() {
  syncAllFromDOM()
  return blocks.map(({ id: _id, ...b }) => b) // strip local id before sending to API
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function makeBlock(type) {
  return { id: ++blockCounter, type, content_es: '', content_en: '', url: '', caption_es: '', caption_en: '' }
}

function removeBlock(id) {
  if (blocks.length <= 1) return
  syncAllFromDOM()
  blocks = blocks.filter(b => b.id !== id)
  render()
}

function moveBlock(id, dir) {
  syncAllFromDOM()
  const idx = blocks.findIndex(b => b.id === id)
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= blocks.length) return
  ;[blocks[idx], blocks[newIdx]] = [blocks[newIdx], blocks[idx]]
  render()
}

function syncAllFromDOM() {
  blocks.forEach(b => {
    if (b.type === 'text') {
      b.content_es = document.getElementById(`blk-es-${b.id}`)?.value ?? b.content_es
      b.content_en = document.getElementById(`blk-en-${b.id}`)?.value ?? b.content_en
    } else {
      b.caption_es = document.getElementById(`blk-cap-es-${b.id}`)?.value ?? b.caption_es
      b.caption_en = document.getElementById(`blk-cap-en-${b.id}`)?.value ?? b.caption_en
    }
  })
}

export function render() {
  const container = document.getElementById('blocksEditor')
  if (!container) return

  attachContainerListener()

  container.innerHTML = blocks.map((block, idx) => renderBlock(block, idx === 0, idx === blocks.length - 1)).join('')

  // Re-attach file inputs (new DOM elements every render)
  container.querySelectorAll('.blk-img-input').forEach(input => {
    input.addEventListener('change', async (e) => {
      const file = e.target.files[0]
      if (!file) return
      const id = parseInt(input.dataset.id)
      e.target.value = ''
      await uploadBlockImage(id, file)
    })
  })
}

function attachContainerListener() {
  if (listenerAttached) return
  const container = document.getElementById('blocksEditor')
  if (!container) return

  container.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.blk-remove')
    if (removeBtn) { removeBlock(parseInt(removeBtn.dataset.id)); return }

    const upBtn = e.target.closest('.blk-up')
    if (upBtn) { moveBlock(parseInt(upBtn.dataset.id), -1); return }

    const dnBtn = e.target.closest('.blk-dn')
    if (dnBtn) { moveBlock(parseInt(dnBtn.dataset.id), 1); return }
  })

  listenerAttached = true
}

async function uploadBlockImage(id, file) {
  const progressEl = document.getElementById(`blk-progress-${id}`)
  if (progressEl) { progressEl.classList.remove('hidden'); progressEl.style.color = '' }

  const block = blocks.find(b => b.id === id)
  if (!block) return

  try {
    const formData = new FormData()
    formData.append('image', file)
    const response = await apiFetch('/api/upload/content', { method: 'POST', body: formData, headers: {} })
    if (response.data?.url) {
      syncAllFromDOM()
      block.url = response.data.url
      render()
    } else {
      if (progressEl) { progressEl.textContent = t('modal.blocks.uploadError'); progressEl.style.color = 'red'; progressEl.classList.remove('hidden') }
    }
  } catch (err) {
    if (progressEl) { progressEl.textContent = (t('modal.blocks.uploadError') || 'Error') + ': ' + err.message; progressEl.style.color = 'red'; progressEl.classList.remove('hidden') }
  }
}

// ─── Render helpers ───────────────────────────────────────────────────────────

function renderBlock(block, isFirst, isLast) {
  const upBtn = isFirst ? '' : `<button type="button" class="blk-up p-1 text-slate-400 hover:text-primary transition-colors" data-id="${block.id}"><span class="material-symbols-outlined text-sm">arrow_upward</span></button>`
  const dnBtn = isLast ? '' : `<button type="button" class="blk-dn p-1 text-slate-400 hover:text-primary transition-colors" data-id="${block.id}"><span class="material-symbols-outlined text-sm">arrow_downward</span></button>`
  const delBtn = `<button type="button" class="blk-remove p-1 text-accent-terracotta hover:text-red-600 transition-colors" data-id="${block.id}"><span class="material-symbols-outlined text-sm">delete</span></button>`

  const controls = `
    <div class="flex items-center gap-0.5">
      ${upBtn}${dnBtn}${delBtn}
    </div>`

  if (block.type === 'text') {
    return `
    <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50">
      <div class="flex items-center justify-between mb-3">
        <span class="flex items-center gap-1 text-xs font-semibold text-slate-500">
          <span class="material-symbols-outlined text-sm">text_fields</span>
          ${escapeHtml(t('modal.blocks.text'))}
        </span>
        ${controls}
      </div>
      <textarea id="blk-es-${block.id}" rows="5"
        class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm resize-none mb-2"
        placeholder="${escapeAttr(t('modal.blocks.textPlaceholder'))}">${escapeHtml(block.content_es)}</textarea>
      <label class="block text-xs font-medium text-accent-teal mb-1">Content (EN)</label>
      <textarea id="blk-en-${block.id}" rows="5"
        class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm resize-none"
        placeholder="${escapeAttr(t('modal.blocks.textEnPlaceholder'))}">${escapeHtml(block.content_en)}</textarea>
    </div>`
  }

  // Image block
  return `
  <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50">
    <div class="flex items-center justify-between mb-3">
      <span class="flex items-center gap-1 text-xs font-semibold text-slate-500">
        <span class="material-symbols-outlined text-sm">image</span>
        ${escapeHtml(t('modal.blocks.image'))}
      </span>
      ${controls}
    </div>
    ${block.url
      ? `<img src="${escapeHtml(block.url)}" class="w-full max-h-48 object-cover rounded-xl mb-3" />`
      : `<div class="w-full h-28 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center mb-3 text-slate-400">
           <span class="material-symbols-outlined text-3xl">add_photo_alternate</span>
         </div>`}
    <label class="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary transition-colors mb-1">
      <span class="material-symbols-outlined text-sm">upload</span>
      <span>${escapeHtml(block.url ? t('modal.blocks.changeImage') : t('modal.blocks.uploadImage'))}</span>
      <input type="file" accept="image/*" class="hidden blk-img-input" data-id="${block.id}" />
    </label>
    <p id="blk-progress-${block.id}" class="hidden text-xs text-slate-400 mb-2">${escapeHtml(t('modal.blocks.uploading'))}</p>
    <label class="block text-xs font-medium text-slate-500 mt-2 mb-1">${escapeHtml(t('modal.blocks.captionEs'))}</label>
    <input type="text" id="blk-cap-es-${block.id}"
      class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm mb-2"
      value="${escapeAttr(block.caption_es)}" placeholder="${escapeAttr(t('modal.blocks.captionPlaceholder'))}" />
    <label class="block text-xs font-medium text-accent-teal mb-1">${escapeHtml(t('modal.blocks.captionEn'))}</label>
    <input type="text" id="blk-cap-en-${block.id}"
      class="w-full px-3 py-2 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors text-sm"
      value="${escapeAttr(block.caption_en)}" placeholder="${escapeAttr(t('modal.blocks.captionPlaceholder'))}" />
  </div>`
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
