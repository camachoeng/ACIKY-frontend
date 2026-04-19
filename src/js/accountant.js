// Accountant public view (instructor + admin only)
import { t } from './i18n.js'
import { apiFetch } from './api.js'
import { requireAuth } from './auth.js'

let summary = { income_cup: 0, income_usd: 0, expense_cup: 0, expense_usd: 0, balance_cup: 0, balance_usd: 0 }
let exchangeRate = 520
let totalCurrency = 'CUP'
let filterType = 'all'
let filterMonth = ''
let lastTransactions = []

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

  if (user.role === 'admin') {
    document.getElementById('generateReportBtn')?.addEventListener('click', generateReport)
  } else {
    document.getElementById('generateReportBtn')?.classList.add('hidden')
  }
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
    lastTransactions = data.data || []
    renderSummary()
    renderTransactions(lastTransactions)
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

function generateReport() {
  const fmt = (n, cur) => `${Number(n || 0).toLocaleString('es-CU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${cur}`
  const periodLabel = filterMonth
    ? new Date(filterMonth + '-15').toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : t('report.allMonths')
  const generatedDate = new Date().toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })

  let totalIncome, totalExpense
  if (totalCurrency === 'CUP') {
    totalIncome = (summary.income_cup || 0) + (summary.income_usd || 0) * exchangeRate
    totalExpense = (summary.expense_cup || 0) + (summary.expense_usd || 0) * exchangeRate
  } else {
    totalIncome = (summary.income_usd || 0) + (summary.income_cup || 0) / exchangeRate
    totalExpense = (summary.expense_usd || 0) + (summary.expense_cup || 0) / exchangeRate
  }

  const txRows = lastTransactions.length === 0
    ? `<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:24px">${t('report.noTransactions')}</td></tr>`
    : lastTransactions.map(tx => {
        const isIncome = tx.type === 'income'
        const date = new Date(tx.date.slice(0, 10) + 'T12:00:00').toLocaleDateString('es-CU', { day: '2-digit', month: '2-digit', year: 'numeric' })
        return `
          <tr>
            <td>${date}</td>
            <td><span style="padding:2px 8px;border-radius:99px;font-size:11px;background:${isIncome ? '#dcfce7' : '#fee2e2'};color:${isIncome ? '#16a34a' : '#dc2626'}">${t('type.' + tx.type)}</span></td>
            <td>${escapeHtml(tx.category)}${tx.donation_id ? ' ★' : ''}</td>
            <td>${escapeHtml(tx.description || '—')}</td>
            <td style="text-align:right;font-weight:600;color:${isIncome ? '#16a34a' : '#e8a090'}">${isIncome ? '+' : '-'}${Number(tx.amount).toLocaleString('es-CU', { minimumFractionDigits: 2 })} ${tx.currency}</td>
          </tr>`
      }).join('')

  const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${t('report.title')} — ACIKY</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #1e293b; padding: 40px; font-size: 13px; }
    .header { border-bottom: 3px solid #708558; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 22px; font-weight: 700; color: #5c6c4a; }
    .header p { color: #64748b; margin-top: 4px; font-size: 12px; }
    .meta { display: flex; gap: 24px; margin-bottom: 24px; }
    .meta-item { }
    .meta-item .label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; font-weight: 600; }
    .meta-item .value { font-weight: 600; color: #1e293b; margin-top: 2px; }
    .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; color: #708558; margin-bottom: 12px; }
    .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 32px; }
    .summary-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
    .summary-card .currency { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; margin-bottom: 10px; }
    .summary-card .total-card { background: #f0f4ec; border-color: #a3be84; }
    .summary-row { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 12px; }
    .summary-row .label { color: #64748b; }
    .summary-row.balance { border-top: 1px solid #e2e8f0; padding-top: 8px; margin-top: 4px; font-weight: 700; color: #5c6c4a; }
    .income { color: #16a34a; font-weight: 600; }
    .expense { color: #e8a090; font-weight: 600; }
    .rate { font-size: 11px; color: #708558; text-align: right; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    tr:last-child td { border-bottom: none; }
    .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${t('report.title')}</h1>
    <p>${t('report.organization')}</p>
  </div>

  <div class="meta">
    <div class="meta-item">
      <div class="label">${t('report.period')}</div>
      <div class="value">${escapeHtml(periodLabel)}</div>
    </div>
    <div class="meta-item">
      <div class="label">${t('report.generatedOn')}</div>
      <div class="value">${generatedDate}</div>
    </div>
  </div>

  <p class="section-title">${t('report.summaryTitle')}</p>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="currency">CUP</div>
      <div class="summary-row"><span class="label">${t('report.income')}</span><span class="income">${fmt(summary.income_cup, 'CUP')}</span></div>
      <div class="summary-row"><span class="label">${t('report.expenses')}</span><span class="expense">${fmt(summary.expense_cup, 'CUP')}</span></div>
      <div class="summary-row balance"><span>${t('report.balance')}</span><span>${fmt(summary.balance_cup, 'CUP')}</span></div>
    </div>
    <div class="summary-card">
      <div class="currency">USD</div>
      <div class="summary-row"><span class="label">${t('report.income')}</span><span class="income">${fmt(summary.income_usd, 'USD')}</span></div>
      <div class="summary-row"><span class="label">${t('report.expenses')}</span><span class="expense">${fmt(summary.expense_usd, 'USD')}</span></div>
      <div class="summary-row balance"><span>${t('report.balance')}</span><span>${fmt(summary.balance_usd, 'USD')}</span></div>
    </div>
    <div class="summary-card" style="background:#f0f4ec;border-color:#a3be84">
      <div class="currency" style="color:#708558">${t('report.total')} (${totalCurrency})</div>
      <div class="summary-row"><span class="label">${t('report.income')}</span><span class="income">${fmt(totalIncome, totalCurrency)}</span></div>
      <div class="summary-row"><span class="label">${t('report.expenses')}</span><span class="expense">${fmt(totalExpense, totalCurrency)}</span></div>
      <div class="summary-row balance" style="border-color:#a3be84"><span>${t('report.balance')}</span><span style="font-size:15px">${fmt(totalIncome - totalExpense, totalCurrency)}</span></div>
      <div class="rate">${t('report.exchangeRate')}: 1 USD = ${exchangeRate} CUP</div>
    </div>
  </div>

  <p class="section-title">${t('report.transactionsTitle')}</p>
  <table>
    <thead>
      <tr>
        <th>${t('table.date')}</th>
        <th>${t('table.type')}</th>
        <th>${t('table.category')}</th>
        <th>${t('table.description')}</th>
        <th style="text-align:right">${t('table.amount')}</th>
      </tr>
    </thead>
    <tbody>${txRows}</tbody>
  </table>

  <div class="footer">ACIKY · aciky.org · ${generatedDate}</div>
  <script>window.onload = () => window.print()<\/script>
</body>
</html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

function escapeHtml(str) {
  if (!str) return ''
  const div = document.createElement('div')
  div.textContent = str
  return div.innerHTML
}
