// Accountant public view (instructor + admin only)
import { t } from './i18n.js'
import { apiFetch } from './api.js'
import { requireAuth } from './auth.js'

let summary = { income_cup: 0, income_usd: 0, expense_cup: 0, expense_usd: 0, balance_cup: 0, balance_usd: 0 }
let exchangeRate = 520
let totalCurrency = 'CUP'
let filterType = 'all'
let filterMonth = ''

export async function initAccountant() {
  const user = await requireAuth()
  if (!user) return

  if (user.role === 'user') {
    window.location.replace('/')
    return
  }

  await loadExchangeRate()
  await loadTransactions()

  document.querySelectorAll('.type-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      filterType = btn.dataset.filterType
      updateTypeFilterBtns()
      loadTransactions()
    })
  })

  document.getElementById('monthFilter')?.addEventListener('change', e => {
    filterMonth = e.target.value
    loadTransactions()
  })

  document.querySelectorAll('.total-currency-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      totalCurrency = btn.dataset.totalCurrency
      updateTotalCurrencyBtns()
      renderSummary()
    })
  })
}

async function loadExchangeRate() {
  try {
    const data = await apiFetch('/api/settings')
    const rate = parseFloat(data.data?.exchange_rate_usd_cup)
    if (rate > 0) exchangeRate = rate
  } catch { /* keep default */ }
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
    list.innerHTML = `<p class="text-center text-red-500 text-sm py-8">${escapeHtml(err.message)}</p>`
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

  document.getElementById('totalIncome').textContent = fmt(totalIncome, totalCurrency)
  document.getElementById('totalExpense').textContent = fmt(totalExpense, totalCurrency)
  document.getElementById('totalBalance').textContent = fmt(totalIncome - totalExpense, totalCurrency)
  const label = document.getElementById('totalCurrencyLabel')
  if (label) label.textContent = `1 USD = ${exchangeRate} CUP`
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
        <span class="font-bold ${amountStyle} flex-shrink-0">${sign}${Number(tx.amount).toLocaleString('es-CU', { minimumFractionDigits: 2 })} ${tx.currency}</span>
      </div>`
  }).join('')
}

function updateTypeFilterBtns() {
  document.querySelectorAll('.type-filter-btn').forEach(btn => {
    const active = btn.dataset.filterType === filterType
    btn.classList.toggle('bg-primary-dark', active)
    btn.classList.toggle('text-white', active)
    btn.classList.toggle('text-slate-500', !active)
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

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
