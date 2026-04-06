import { requireAdmin } from '../auth.js'
import { apiFetch } from '../api.js'
import { t } from '../i18n.js'

let summary = { income_cup: 0, income_usd: 0, expense_cup: 0, expense_usd: 0, balance_cup: 0, balance_usd: 0 }
let exchangeRate = 520
let totalCurrency = 'CUP'
let filterType = 'all'
let filterMonth = ''
let editingId = null

export async function initAdminAccountant() {
  const user = await requireAdmin()
  if (!user) return

  await loadExchangeRate()
  await loadTransactions()

  document.getElementById('saveRateBtn')?.addEventListener('click', saveExchangeRate)
  document.getElementById('addTransactionBtn')?.addEventListener('click', () => openModal())
  document.getElementById('modalOverlay')?.addEventListener('click', closeModal)
  document.getElementById('modalCancelBtn')?.addEventListener('click', closeModal)
  document.getElementById('modalSaveBtn')?.addEventListener('click', saveTransaction)
  document.getElementById('monthFilter')?.addEventListener('change', e => {
    filterMonth = e.target.value
    loadTransactions()
  })

  document.querySelectorAll('.type-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterType = btn.dataset.filterType
      updateTypeFilterBtns()
      loadTransactions()
    })
  })

  document.querySelectorAll('.total-currency-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      totalCurrency = btn.dataset.totalCurrency
      updateTotalCurrencyBtns()
      renderSummary()
    })
  })

  document.querySelectorAll('.modal-type-btn').forEach(btn => {
    btn.addEventListener('click', () => setModalType(btn.dataset.modalType))
  })
}

async function loadExchangeRate() {
  try {
    const data = await apiFetch('/api/settings')
    const rate = parseFloat(data.data?.exchange_rate_usd_cup)
    if (rate > 0) exchangeRate = rate
    const input = document.getElementById('exchangeRateInput')
    if (input) input.value = exchangeRate
  } catch { /* keep default */ }
}

async function saveExchangeRate() {
  const input = document.getElementById('exchangeRateInput')
  const status = document.getElementById('rateSaveStatus')
  const rate = parseFloat(input?.value)
  if (!rate || rate <= 0) return

  try {
    await apiFetch('/api/settings', {
      method: 'PUT',
      body: JSON.stringify({ exchange_rate_usd_cup: String(rate) })
    })
    exchangeRate = rate
    renderSummary()
    if (status) { status.textContent = t('exchangeRate.saved'); status.classList.remove('hidden') }
    setTimeout(() => status?.classList.add('hidden'), 2500)
  } catch {
    if (status) { status.textContent = t('exchangeRate.saveError'); status.classList.remove('hidden') }
  }
}

async function loadTransactions() {
  const list = document.getElementById('transactionsList')
  if (!list) return
  list.innerHTML = `<div class="flex justify-center py-12"><span class="material-symbols-outlined animate-spin text-primary text-3xl">progress_activity</span></div>`

  try {
    const params = new URLSearchParams()
    if (filterType !== 'all') params.set('type', filterType)
    if (filterMonth) params.set('month', filterMonth)
    const qs = params.toString() ? '?' + params.toString() : ''

    const data = await apiFetch(`/api/transactions${qs}`)
    summary = data.summary || summary
    renderSummary()
    renderTransactions(data.data || [])
  } catch (err) {
    list.innerHTML = `<p class="text-center text-red-500 text-sm py-8">${t('errors.loadError')}: ${escapeHtml(err.message)}</p>`
  }
}

function renderSummary() {
  const fmt = (n, cur) => `${Number(n || 0).toLocaleString('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`

  document.getElementById('incomeCup').textContent = fmt(summary.income_cup, 'CUP')
  document.getElementById('expenseCup').textContent = fmt(summary.expense_cup, 'CUP')
  document.getElementById('balanceCup').textContent = fmt(summary.balance_cup, 'CUP')
  document.getElementById('incomeUsd').textContent = fmt(summary.income_usd, 'USD')
  document.getElementById('expenseUsd').textContent = fmt(summary.expense_usd, 'USD')
  document.getElementById('balanceUsd').textContent = fmt(summary.balance_usd, 'USD')

  let totalIncome, totalExpense
  if (totalCurrency === 'CUP') {
    totalIncome = (summary.income_cup || 0) + (summary.income_usd || 0) * exchangeRate
    totalExpense = (summary.expense_cup || 0) + (summary.expense_usd || 0) * exchangeRate
  } else {
    totalIncome = (summary.income_usd || 0) + (summary.income_cup || 0) / exchangeRate
    totalExpense = (summary.expense_usd || 0) + (summary.expense_cup || 0) / exchangeRate
  }
  const totalBal = totalIncome - totalExpense

  document.getElementById('totalIncome').textContent = fmt(totalIncome, totalCurrency)
  document.getElementById('totalExpense').textContent = fmt(totalExpense, totalCurrency)
  document.getElementById('totalBalance').textContent = fmt(totalBal, totalCurrency)
  const label = document.getElementById('totalCurrencyLabel')
  if (label) label.textContent = totalCurrency === 'CUP' ? `1 USD = ${exchangeRate} CUP` : `1 USD = ${exchangeRate} CUP`
}

function renderTransactions(transactions) {
  const list = document.getElementById('transactionsList')
  if (!list) return

  if (transactions.length === 0) {
    list.innerHTML = `<p class="text-center text-slate-400 text-sm py-12">${t('empty')}</p>`
    return
  }

  list.innerHTML = transactions.map(tx => {
    const isIncome = tx.type === 'income'
    const typeStyle = isIncome ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'
    const amountStyle = isIncome ? 'text-green-600' : 'text-accent-terracotta'
    const sign = isIncome ? '+' : '-'
    const date = new Date(tx.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CU', { day: '2-digit', month: '2-digit', year: 'numeric' })

    return `
      <div class="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4 flex-wrap">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <span class="text-xs px-2 py-0.5 rounded-full font-medium ${typeStyle}">${t('type.' + tx.type)}</span>
            <span class="text-xs font-medium text-slate-500">${escapeHtml(tx.category)}</span>
            ${tx.donation_id ? `<span class="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">${t('donationBadge')}</span>` : ''}
            <span class="text-xs text-slate-400">${date}</span>
          </div>
          ${tx.description ? `<p class="text-xs text-slate-500 mt-0.5">${escapeHtml(tx.description)}</p>` : ''}
        </div>
        <div class="flex items-center gap-3 flex-shrink-0">
          <span class="font-bold ${amountStyle}">${sign}${Number(tx.amount).toLocaleString('es-CU', { minimumFractionDigits: 2 })} ${tx.currency}</span>
          <button data-action="edit" data-id="${tx.id}" class="text-slate-400 hover:text-primary transition-colors">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button data-action="delete" data-id="${tx.id}" class="text-slate-400 hover:text-accent-terracotta transition-colors">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </div>
      </div>`
  }).join('')

  list.addEventListener('click', async e => {
    const btn = e.target.closest('[data-action]')
    if (!btn) return
    const id = parseInt(btn.dataset.id)
    if (btn.dataset.action === 'edit') openModal(transactions.find(tx => tx.id === id))
    if (btn.dataset.action === 'delete') await deleteTransaction(id)
  }, { once: true })
}

function openModal(tx = null) {
  editingId = tx ? tx.id : null
  const modal = document.getElementById('transactionModal')
  const title = document.getElementById('modalTitle')

  if (title) title.textContent = tx ? t('modal.editTitle') : t('modal.addTitle')

  const saveBtn = document.getElementById('modalSaveBtn')
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('modal.save') }

  setModalType(tx?.type || 'income')
  document.getElementById('modalAmount').value = tx?.amount || ''
  document.getElementById('modalCurrency').value = tx?.currency || 'CUP'
  document.getElementById('modalCategory').value = tx?.category || ''
  document.getElementById('modalDate').value = tx?.date?.slice(0, 10) || new Date().toISOString().slice(0, 10)
  document.getElementById('modalDescription').value = tx?.description || ''
  document.getElementById('modalError')?.classList.add('hidden')

  modal?.classList.remove('hidden')
}

function closeModal() {
  document.getElementById('transactionModal')?.classList.add('hidden')
  editingId = null
}

function setModalType(type) {
  document.getElementById('modalType').value = type
  document.querySelectorAll('.modal-type-btn').forEach(btn => {
    const active = btn.dataset.modalType === type
    btn.classList.toggle('border-primary', active)
    btn.classList.toggle('bg-primary/5', active)
    btn.classList.toggle('text-primary-dark', active)
    btn.classList.toggle('border-slate-200', !active)
    btn.classList.toggle('text-slate-500', !active)
  })
}

async function saveTransaction() {
  const saveBtn = document.getElementById('modalSaveBtn')
  const errorEl = document.getElementById('modalError')

  const type = document.getElementById('modalType').value
  const amount = parseFloat(document.getElementById('modalAmount').value)
  const currency = document.getElementById('modalCurrency').value
  const category = document.getElementById('modalCategory').value.trim()
  const date = document.getElementById('modalDate').value
  const description = document.getElementById('modalDescription').value.trim()

  if (errorEl) errorEl.classList.add('hidden')

  if (!type || !amount || !currency || !category || !date) {
    showModalError(t('errors.required'))
    return
  }
  if (isNaN(amount) || amount <= 0) {
    showModalError(t('errors.required'))
    return
  }

  saveBtn.disabled = true
  saveBtn.textContent = t('modal.saving')

  const body = { type, amount, currency, category, date, description: description || null }

  try {
    if (editingId) {
      await apiFetch(`/api/transactions/${editingId}`, { method: 'PUT', body: JSON.stringify(body) })
    } else {
      await apiFetch('/api/transactions', { method: 'POST', body: JSON.stringify(body) })
    }
    closeModal()
    await loadTransactions()
  } catch (err) {
    showModalError(t('errors.saveError') + ': ' + err.message)
    saveBtn.disabled = false
    saveBtn.textContent = t('modal.save')
  }
}

async function deleteTransaction(id) {
  if (!confirm(t('confirm.delete'))) return
  try {
    await apiFetch(`/api/transactions/${id}`, { method: 'DELETE' })
    await loadTransactions()
  } catch (err) {
    alert(t('errors.deleteError') + ': ' + err.message)
  }
}

function updateTypeFilterBtns() {
  document.querySelectorAll('.type-filter-btn').forEach(btn => {
    const active = btn.dataset.filterType === filterType
    btn.classList.toggle('bg-primary-dark', active)
    btn.classList.toggle('text-white', active)
    btn.classList.toggle('text-slate-500', !active)
    btn.classList.remove('bg-slate-50')
  })
}

function updateTotalCurrencyBtns() {
  document.querySelectorAll('.total-currency-btn').forEach(btn => {
    const active = btn.dataset.totalCurrency === totalCurrency
    btn.classList.toggle('bg-primary-dark', active)
    btn.classList.toggle('text-white', active)
    btn.classList.toggle('bg-slate-100', !active)
    btn.classList.toggle('text-slate-600', !active)
  })
}

function showModalError(msg) {
  const el = document.getElementById('modalError')
  if (el) { el.textContent = msg; el.classList.remove('hidden') }
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
