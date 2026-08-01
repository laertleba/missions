import { useState } from 'react'
import { T } from '../lib/theme'
import { createAssignment } from '../lib/assignmentsApi'

export default function AssignTaskModal({ domain, onClose, onSent }) {
  const [email, setEmail] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    const assigneeEmail = email.trim()
    const t = title.trim()
    if (!assigneeEmail || !t) return
    setSending(true)
    setError('')
    try {
      await createAssignment({ assigneeEmail, title: t, description: description.trim() })
      onSent && onSent()
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to send assignment')
    } finally {
      setSending(false)
    }
  }

  const inp = {
    backgroundColor: T.bgInput,
    border: '1px solid ' + T.borderSubtle,
    borderRadius: '4px',
    padding: '9px 12px',
    color: T.textPrimary,
    fontSize: '13px',
    fontFamily: T.fontMono,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }
  const lbl = {
    display: 'block', fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono,
    marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: T.bgSurface,
          border: '1px solid ' + T.accentMuted,
          borderRadius: T.rMd,
          padding: '24px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: T.shGlow,
        }}
      >
        <h3 style={{ margin: '0 0 6px 0', fontSize: '13px', color: T.accent, fontFamily: T.fontMono, letterSpacing: '0.1em', textTransform: 'uppercase', textShadow: T.textGlow }}>
          ▌ Assign Task
        </h3>
        {domain && (
          <div style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontMono, marginBottom: '18px' }}>
            Only colleagues @{domain} can be assigned
          </div>
        )}

        <label style={lbl}>Colleague's email</label>
        <input
          autoFocus
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={domain ? `name@${domain}` : 'name@company.com'}
          style={{ ...inp, marginBottom: '14px' }}
        />

        <label style={lbl}>Task title</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') onClose() }}
          placeholder="What needs to be done…"
          style={{ ...inp, marginBottom: '14px' }}
        />

        <label style={lbl}>Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Optional details…"
          rows={3}
          style={{ ...inp, marginBottom: '14px', resize: 'vertical', lineHeight: '1.5' }}
        />

        {error && (
          <div style={{ fontSize: '11px', color: '#ff8a8a', fontFamily: T.fontMono, marginBottom: '14px' }}>{error}</div>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            disabled={sending}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid ' + T.borderSubtle, backgroundColor: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: '12px', fontFamily: T.fontMono }}
          >Cancel</button>
          <button
            onClick={handleSend}
            disabled={sending || !email.trim() || !title.trim()}
            style={{ flex: 2, padding: '10px', borderRadius: '4px', border: '1px solid ' + T.accent, backgroundColor: T.accentGlow, color: T.accent, cursor: 'pointer', fontSize: '12px', fontFamily: T.fontMono, fontWeight: '600', textShadow: T.textGlow, opacity: sending || !email.trim() || !title.trim() ? 0.5 : 1 }}
          >{sending ? 'Sending…' : 'Send Assignment'}</button>
        </div>
      </div>
    </div>
  )
}
