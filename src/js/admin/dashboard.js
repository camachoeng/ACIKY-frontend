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
}
