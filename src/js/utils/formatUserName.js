/**
 * Format user's display name consistently across the app
 * @param {Object} user - User object with name fields
 * @returns {string} Formatted display name
 */
export function formatUserName(user) {
  if (!user) return ''

  // New schema: name + last_name + optional spiritual_name
  if (user.name && user.last_name) {
    const fullName = `${user.name} ${user.last_name}`
    return user.spiritual_name ? `${fullName} (${user.spiritual_name})` : fullName
  }

  // Fallback for legacy users (only username or name)
  return user.name || user.username || ''
}

/**
 * Format user's short name (first name only)
 * For use in greetings like "Hello, Maria"
 * @param {Object} user - User object
 * @returns {string} Short name (first name or username)
 */
export function formatUserShortName(user) {
  if (!user) return ''
  return user.name || user.username || ''
}
