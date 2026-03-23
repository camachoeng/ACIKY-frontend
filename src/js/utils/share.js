import { t } from '../i18n.js'

export async function shareContent({ title, text, url, imageUrl }) {
  if (navigator.share) {
    try {
      const shareData = { title, text, url }

      if (imageUrl && navigator.canShare) {
        try {
          const res = await fetch(imageUrl)
          const blob = await res.blob()
          const ext = blob.type.split('/')[1] || 'jpg'
          const file = new File([blob], `image.${ext}`, { type: blob.type })
          if (navigator.canShare({ files: [file] })) {
            shareData.files = [file]
          }
        } catch {
          // image unavailable — share without it
        }
      }

      await navigator.share(shareData)
    } catch (err) {
      if (err.name !== 'AbortError') {
        await fallbackCopy(url)
      }
    }
  } else {
    await fallbackCopy(url)
  }
}

async function fallbackCopy(url) {
  try {
    await navigator.clipboard.writeText(url)
  } catch {
    const el = document.createElement('textarea')
    el.value = url
    el.style.cssText = 'position:fixed;opacity:0'
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
  showCopiedToast()
}

function showCopiedToast() {
  const existing = document.getElementById('shareToast')
  if (existing) existing.remove()

  const toast = document.createElement('div')
  toast.id = 'shareToast'
  toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-primary-dark text-white text-sm px-4 py-2 rounded-full shadow-lg z-50 flex items-center gap-2'

  const icon = document.createElement('span')
  icon.className = 'material-symbols-outlined text-sm'
  icon.textContent = 'check_circle'

  const label = document.createElement('span')
  label.textContent = t('common.urlCopied')

  toast.appendChild(icon)
  toast.appendChild(label)
  document.body.appendChild(toast)
  setTimeout(() => toast.remove(), 2500)
}
