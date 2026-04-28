import { t } from '../i18n.js'
import { apiFetch } from '../api.js'
import { requireAdmin } from '../auth.js'

export async function initEmailBroadcast() {
  await requireAdmin()

  initToolbars()

  document.getElementById('broadcastForm')?.addEventListener('submit', sendBroadcast)
  document.getElementById('previewBtn')?.addEventListener('click', showPreview)
  document.getElementById('closePreviewBtn')?.addEventListener('click', closePreview)
  document.getElementById('sendAnotherBtn')?.addEventListener('click', resetForm)

  document.getElementById('roleUser')?.addEventListener('change', updateRecipientCount)
  document.getElementById('roleInstructor')?.addEventListener('change', updateRecipientCount)

  await updateRecipientCount()
}

function initToolbars() {
  document.querySelectorAll('[data-toolbar]').forEach(toolbar => {
    const editorId = toolbar.dataset.toolbar
    const editor = document.getElementById(editorId)
    if (!editor) return

    let savedRange = null

    const saveSelection = () => {
      const sel = window.getSelection()
      if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
        savedRange = sel.getRangeAt(0).cloneRange()
      }
    }

    const restoreSelection = () => {
      if (!savedRange) return
      const sel = window.getSelection()
      sel.removeAllRanges()
      sel.addRange(savedRange)
    }

    editor.addEventListener('keyup', () => { saveSelection(); updateToolbarState(toolbar) })
    editor.addEventListener('mouseup', () => { saveSelection(); updateToolbarState(toolbar) })
    editor.addEventListener('focus', () => updateToolbarState(toolbar))

    toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault()
        editor.focus()
        restoreSelection()

        const cmd = btn.dataset.cmd
        if (cmd === 'createLink') {
          const url = prompt(editorId === 'bodyEs' ? 'URL del enlace:' : 'Link URL:')
          if (url) document.execCommand('createLink', false, url)
        } else {
          document.execCommand(cmd, false, null)
        }
        saveSelection()
        updateToolbarState(toolbar)
      })
    })
  })
}

const STATE_CMDS = ['bold', 'italic', 'underline']

function updateToolbarState(toolbar) {
  toolbar.querySelectorAll('.toolbar-btn[data-cmd]').forEach(btn => {
    if (!STATE_CMDS.includes(btn.dataset.cmd)) return
    const active = document.queryCommandState(btn.dataset.cmd)
    btn.classList.toggle('bg-slate-200', active)
    btn.classList.toggle('text-primary-dark', active)
  })
}

async function updateRecipientCount() {
  const roles = getSelectedRoles()
  const countEl = document.getElementById('recipientCount')
  if (!countEl) return
  if (roles.length === 0) {
    countEl.textContent = t('recipients.none')
    return
  }
  try {
    const data = await apiFetch('/api/users')
    const users = data.data || data || []
    const count = users.filter(u => roles.includes(u.role)).length
    countEl.textContent = t('recipients.count').replace('{{count}}', count)
  } catch {
    countEl.textContent = ''
  }
}

function getSelectedRoles() {
  const roles = []
  if (document.getElementById('roleUser')?.checked) roles.push('user')
  if (document.getElementById('roleInstructor')?.checked) roles.push('instructor')
  return roles
}

function getEditorContent(id) {
  return document.getElementById(id)?.innerHTML.trim() || ''
}

function showPreview() {
  const subjectEs = document.getElementById('subjectEs')?.value.trim()
  const subjectEn = document.getElementById('subjectEn')?.value.trim()
  const bodyEs = getEditorContent('bodyEs')
  const bodyEn = getEditorContent('bodyEn')

  const previewContent = document.getElementById('previewContent')
  if (!previewContent) return

  previewContent.innerHTML = buildEmailPreview({ subjectEs, subjectEn, bodyEs, bodyEn })
  document.getElementById('previewModal')?.classList.remove('hidden')
}

function closePreview() {
  document.getElementById('previewModal')?.classList.add('hidden')
}

function buildEmailPreview({ subjectEs, subjectEn, bodyEs, bodyEn }) {
  return `
    <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 560px; margin: 0 auto;">
      <div style="background: #5c6c4a; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <span style="color: white; font-size: 22px; font-weight: bold; letter-spacing: 3px;">ACIKY</span>
        <p style="color: rgba(255,255,255,0.7); font-size: 12px; margin: 4px 0 0;">Alianza Cubana de Instructores en Kundalini Yoga</p>
      </div>
      <div style="background: white; padding: 32px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
        <h2 style="color: #5c6c4a; font-size: 17px; margin: 0 0 14px; font-weight: bold;">${escapeText(subjectEs) || '—'}</h2>
        <div style="color: #475569; font-size: 14px; line-height: 1.7;">${bodyEs || '—'}</div>
        <hr style="border: none; border-top: 2px solid #f1f5f9; margin: 28px 0;" />
        <h2 style="color: #5c6c4a; font-size: 17px; margin: 0 0 14px; font-weight: bold;">${escapeText(subjectEn) || '—'}</h2>
        <div style="color: #475569; font-size: 14px; line-height: 1.7;">${bodyEn || '—'}</div>
        <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 28px 0;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
          ACIKY · <a href="https://aciky.org" style="color: #708558;">aciky.org</a> · info.aciky@gmail.com
        </p>
      </div>
    </div>
  `
}

function escapeText(str) {
  if (!str) return ''
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function sendBroadcast(e) {
  e.preventDefault()

  const subjectEs = document.getElementById('subjectEs')?.value.trim()
  const subjectEn = document.getElementById('subjectEn')?.value.trim()
  const bodyEs = getEditorContent('bodyEs')
  const bodyEn = getEditorContent('bodyEn')
  const roles = getSelectedRoles()

  hideError()

  if (!subjectEs || !subjectEn || !bodyEs || !bodyEn) {
    showError(t('errors.allFieldsRequired'))
    return
  }
  if (roles.length === 0) {
    showError(t('errors.noRoles'))
    return
  }

  const sendBtn = document.getElementById('sendBtn')
  sendBtn.disabled = true
  sendBtn.querySelector('[data-i18n]').textContent = t('form.sending')

  try {
    const result = await apiFetch('/api/emails/broadcast', {
      method: 'POST',
      body: JSON.stringify({ subject_es: subjectEs, subject_en: subjectEn, body_es: bodyEs, body_en: bodyEn, roles })
    })

    const resultData = result.data || result
    const countEl = document.getElementById('successCount')
    if (countEl) {
      // Backend may respond with { queued } (async) or { sent, errors } (sync)
      if (resultData.queued !== undefined) {
        countEl.textContent = t('success.queued').replace('{{queued}}', resultData.queued)
      } else {
        const sent = resultData.sent ?? 0
        const errors = resultData.errors ?? 0
        countEl.textContent = t('success.count').replace('{{sent}}', sent).replace('{{errors}}', errors)
      }
    }

    document.getElementById('broadcastForm')?.classList.add('hidden')
    document.getElementById('successState')?.classList.remove('hidden')
  } catch {
    showError(t('errors.sendFailed'))
    sendBtn.disabled = false
    sendBtn.querySelector('[data-i18n]').textContent = t('form.send')
  }
}

function resetForm() {
  document.getElementById('broadcastForm')?.classList.remove('hidden')
  document.getElementById('successState')?.classList.add('hidden')
  document.getElementById('broadcastForm')?.reset()
  document.getElementById('bodyEs').innerHTML = ''
  document.getElementById('bodyEn').innerHTML = ''
  const sendBtn = document.getElementById('sendBtn')
  sendBtn.disabled = false
  sendBtn.querySelector('[data-i18n]').textContent = t('form.send')
  updateRecipientCount()
}

function showError(msg) {
  const el = document.getElementById('formError')
  if (el) { el.textContent = msg; el.classList.remove('hidden') }
}

function hideError() {
  document.getElementById('formError')?.classList.add('hidden')
}
