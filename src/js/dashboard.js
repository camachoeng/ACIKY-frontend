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

    document.getElementById('profileName').value = profile.name || ''
    document.getElementById('profileLastName').value = profile.last_name || ''
    document.getElementById('profileSpiritualName').value = profile.spiritual_name || ''
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
    document.getElementById('profileName').value = user.name || ''
    document.getElementById('profileLastName').value = user.last_name || ''
    document.getElementById('profileSpiritualName').value = user.spiritual_name || ''
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

  // Profile form submit handler
  const profileForm = document.getElementById('profileForm')
  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault()

      const saveBtn = document.getElementById('saveProfileBtn')
      const successMsg = document.getElementById('profileSuccess')
      const errorMsg = document.getElementById('profileError')

      saveBtn.disabled = true
      saveBtn.textContent = t('form.saving')
      successMsg?.classList.add('hidden')
      errorMsg?.classList.add('hidden')

      try {
        const body = {
          name: document.getElementById('profileName').value.trim(),
          last_name: document.getElementById('profileLastName').value.trim(),
          spiritual_name: document.getElementById('profileSpiritualName').value.trim() || null
        }

        await apiFetch('/api/users/profile', {
          method: 'PUT',
          body: JSON.stringify(body)
        })

        successMsg?.classList.remove('hidden')

        // Update cached user in auth
        const updatedUser = await apiFetch('/api/auth/check')
        if (updatedUser.user) {
          localStorage.setItem('user', JSON.stringify(updatedUser.user))
          // Trigger header greeting update
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser.user }))
        }
      } catch (err) {
        if (errorMsg) {
          errorMsg.textContent = err.message || t('form.error')
          errorMsg.classList.remove('hidden')
        }
      }

      saveBtn.disabled = false
      saveBtn.textContent = t('form.saveButton')
    })
  }
}
