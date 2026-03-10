import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'

export async function initAdminDashboard() {
  const user = await requireAdmin()
  if (!user) return

  try {
    const [usersData, activitiesData] = await Promise.all([
      apiFetch('/api/users'),
      apiFetch('/api/activities')
    ])

    const users = usersData.data || []
    const activities = activitiesData.data || []

    const statUsers = document.getElementById('statUsers')
    const statActivities = document.getElementById('statActivities')
    const statInstructors = document.getElementById('statInstructors')
    const statSpaces = document.getElementById('statSpaces')

    if (statUsers) statUsers.textContent = users.length
    if (statActivities) statActivities.textContent = activities.filter(a => a.active).length
    if (statInstructors) statInstructors.textContent = users.filter(u => u.role === 'instructor').length
    if (statSpaces) {
      const locations = new Set(activities.map(a => a.location).filter(Boolean))
      statSpaces.textContent = locations.size
    }
  } catch (err) {
    console.error('Dashboard stats error:', err)
  }

  loadNotifications()
}

async function loadNotifications() {
  try {
    const [testimonialsData, blogData] = await Promise.all([
      apiFetch('/api/testimonials'),
      apiFetch('/api/blog')
    ])

    const testimonials = testimonialsData.data || []
    const pendingCount = testimonials.filter(t => t.status === 'pending').length

    const posts = blogData.data || []
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentCount = posts.filter(p => new Date(p.created_at) > sevenDaysAgo).length

    let hasNotifications = false

    if (pendingCount > 0) {
      const card = document.getElementById('pendingTestimonialsCard')
      const count = document.getElementById('pendingTestimonialsCount')
      if (card && count) {
        count.textContent = pendingCount
        card.classList.remove('hidden')
        hasNotifications = true
      }
    }

    if (recentCount > 0) {
      const card = document.getElementById('recentBlogsCard')
      const count = document.getElementById('recentBlogsCount')
      if (card && count) {
        count.textContent = recentCount
        card.classList.remove('hidden')
        hasNotifications = true
      }
    }

    if (hasNotifications) {
      document.getElementById('notificationsSection')?.classList.remove('hidden')
    }
  } catch (err) {
    console.error('Dashboard notifications error:', err)
  }
}
