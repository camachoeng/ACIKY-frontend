// Admin donations management
import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

let currentFilter = 'all'

export async function initAdminDonations() {
  const user = await requireAdmin()
  if (!user) return

  document.querySelectorAll('.filter-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter
      updateFilterTabs()
      loadDonations()
    })
  })

  await loadDonations()
}

function updateFilterTabs() {
  document.querySelectorAll('.filter-tab').forEach(btn => {
    const active = btn.dataset.filter === currentFilter
    btn.classList.toggle('border-primary', active)
    btn.classList.toggle('text-primary-dark', active)
    btn.classList.toggle('border-transparent', !active)
    btn.classList.toggle('text-slate-500', !active)
  })
}

async function loadDonations() {
  const list = document.getElementById('donationsList')
  if (!list) return

  list.innerHTML = `<div class="flex justify-center py-12"><span class="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>`

  try {
    const params = currentFilter !== 'all' ? `?status=${currentFilter}` : ''
    const data = await apiFetch(`/api/donations${params}`)
    const donations = data.data || []
    renderDonations(donations)
  } catch (err) {
    list.innerHTML = `<p class="text-center text-red-500 text-sm py-8">${t('errors.loadError')}: ${escapeHtml(err.message)}</p>`
  }
}

function renderDonations(donations) {
  const list = document.getElementById('donationsList')
  if (!list) return

  if (donations.length === 0) {
    list.innerHTML = `<p class="text-center text-slate-400 text-sm py-12">${t('empty')}</p>`
    return
  }

  const STATUS_STYLES = {
    pending: 'bg-amber-100 text-amber-700',
    confirmed: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600'
  }

  list.innerHTML = donations.map(d => {
    const statusStyle = STATUS_STYLES[d.status] || STATUS_STYLES.pending
    const method = t(`methods.${d.status === 'paypal' ? 'paypal' : d.payment_method}`) || d.payment_method
    const date = new Date(d.created_at).toLocaleDateString('es-CU', { day: '2-digit', month: '2-digit', year: 'numeric' })

    return `
      <div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5" data-id="${d.id}">
        <div class="flex items-start justify-between gap-4 flex-wrap">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <p class="font-semibold text-primary-dark text-sm">${escapeHtml(d.name)}</p>
              <span class="text-xs px-2 py-0.5 rounded-full font-medium ${statusStyle}">${t('status.' + d.status)}</span>
              <span class="text-xs text-slate-400">${date}</span>
            </div>
            <p class="text-xs text-slate-500 mb-2">${escapeHtml(d.email)}</p>
            <div class="flex flex-wrap gap-3 text-xs text-slate-600">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-primary text-sm">payments</span>
                <strong>${escapeHtml(String(d.amount))} ${escapeHtml(d.currency)}</strong>
              </span>
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-slate-400 text-sm">account_balance_wallet</span>
                ${escapeHtml(t('methods.' + d.payment_method) || d.payment_method)}
              </span>
              ${d.transaction_ref ? `
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-slate-400 text-sm">tag</span>
                ${escapeHtml(d.transaction_ref)}
              </span>` : ''}
            </div>
            ${d.notes ? `<p class="text-xs text-slate-500 mt-2 italic">"${escapeHtml(d.notes)}"</p>` : ''}
          </div>
          ${d.status === 'pending' ? `
          <div class="flex gap-2 flex-shrink-0">
            <button data-action="confirm" data-id="${d.id}"
                    class="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-full text-xs font-medium transition-colors">
              <span class="material-symbols-outlined text-sm">check</span>
              <span>${t('actions.confirm')}</span>
            </button>
            <button data-action="reject" data-id="${d.id}"
                    class="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-full text-xs font-medium transition-colors">
              <span class="material-symbols-outlined text-sm">close</span>
              <span>${t('actions.reject')}</span>
            </button>
          </div>` : ''}
        </div>
      </div>`
  }).join('')

  list.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const { action, id } = btn.dataset
    if (action === 'confirm' || action === 'reject') {
      await updateStatus(parseInt(id), action === 'confirm' ? 'confirmed' : 'rejected')
    }
  }, { once: true })
}

async function updateStatus(id, status) {
  try {
    await apiFetch(`/api/donations/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
    await loadDonations()
  } catch (err) {
    alert(t('errors.updateError') + ': ' + err.message)
  }
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
