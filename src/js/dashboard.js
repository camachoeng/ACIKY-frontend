import { apiFetch, API_BASE } from './api.js'
import { requireAuth } from './auth.js'
import { t } from './i18n.js'

export async function initDashboard() {
  const user = await requireAuth()
  if (!user) return

  const loading = document.getElementById('profileLoading')
  const content = document.getElementById('profileContent')
  const profileImage = document.getElementById('profileImage')
  const imageUpload = document.getElementById('imageUpload')
  const uploadProgress = document.getElementById('uploadProgress')
  const uploadError = document.getElementById('uploadError')
  const instructorSection = document.getElementById('instructorSection')

  // Load current user profile
  try {
    const data = await apiFetch('/api/users/me')
    const profile = data.data

    document.getElementById('profileUsername').value = profile.username || ''
    document.getElementById('profileEmail').value = profile.email || ''

    if (profile.profile_image_url) {
      profileImage.src = profile.profile_image_url
    }

    // Show instructor section for instructors and admins
    if (['instructor', 'admin'].includes(profile.role)) {
      instructorSection.classList.remove('hidden')
    }
  } catch (err) {
    // Fallback: populate from the auth user object
    document.getElementById('profileUsername').value = user.username || ''
    document.getElementById('profileEmail').value = user.email || ''

    // Show instructor section for instructors and admins (fallback)
    if (['instructor', 'admin'].includes(user.role)) {
      instructorSection.classList.remove('hidden')
    }
  }

  loading.classList.add('hidden')
  content.classList.remove('hidden')

  // Image upload handler
  if (imageUpload) {
    imageUpload.addEventListener('change', async (e) => {
      const file = e.target.files[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        uploadError.textContent = t('profileImage.sizeError')
        uploadError.classList.remove('hidden')
        return
      }

      uploadError.classList.add('hidden')
      uploadProgress.classList.remove('hidden')

      try {
        const formData = new FormData()
        formData.append('image', file)

        // Upload to Cloudinary via backend (raw fetch, not apiFetch, because multipart)
        const res = await fetch(`${API_BASE}/api/upload/image`, {
          method: 'POST',
          credentials: 'include',
          body: formData
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Upload failed')

        // Update profile with new image URL
        await apiFetch('/api/users/profile', {
          method: 'PUT',
          body: JSON.stringify({ profile_image_url: data.data.url })
        })

        profileImage.src = data.data.url
        uploadProgress.classList.add('hidden')
      } catch (err) {
        uploadProgress.classList.add('hidden')
        uploadError.textContent = err.message || t('profileImage.uploadError')
        uploadError.classList.remove('hidden')
      }

      imageUpload.value = ''
    })
  }
}
