import { useEffect, useState } from 'react'
import { T } from '../lib/theme'
import { getMyAssignments, getSentAssignments, updateAssignmentStatus, requestAssignmentUpdate } from '../lib/assignmentsApi'

export default function AssignedToMeView({ isMobile }) {
  const [tab, setTab] = useState('received') // 'received' | 'sent'
  const [received, setReceived] = useState([])
  const [sent, setSent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMyAssignments(), getSentAssignments()]).then(([r, s]) => {
      setReceived(r); setSent(s); setLoading(false)
    })
  }, [])

  async function markDone(id) {
    setReceived(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a))
    try { await updateAssignmentStatus(id, 'completed') }
    catch { setReceived(prev => prev.map(a => a.id === id ? { ...a, status: 'pending' } : a)) }
  }

  async function requestUpdate(id) {
    const prevAt = sent.find(a => a.id === id)?.update_requested_at ?? null
    setSent(prev => prev.map(a => a.id === id ? { ...a, update_requested_at: new Date().toISOString() } : a))
    try { await requestAssignmentUpdate(id) }
    catch { setSent(prev => prev.map(a => a.id === id ? { ...a, update_requested_at: prevAt } : a)) }
  }

  if (loading) {
    return <div style={{ padding: '24px 12px', color: T.textMuted, fontSize: '13px', fontFamily: T.fontMono, textAlign: 'center' }}>Loading…</div>
  }

  const list = tab === 'received' ? received : sent
  const pending = list.filter(a => a.status !== 'completed')
  const completed = list.filter(a => a.status === 'completed')

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '4px', backgroundColor: T.bgSurfaceAlt, borderRadius: '4px', padding: '3px', border: '1px solid ' + T.borderSubtle, marginBottom: '16px', width: 'fit-content' }}>
        {[['received', `Received${received.length ? ` (${received.length})` : ''}`], ['sent', `Sent${sent.length ? ` (${sent.length})` : ''}`]].map(([v, label]) => {
          const active = tab === v
          return (
            <button key={v} onClick={() => setTab(v)} style={{
              backgroundColor: active ? T.accentGlow : 'transparent',
              border: '1px solid ' + (active ? T.accentMuted : 'transparent'),
              borderRadius: '3px', padding: '6px 14px',
              color: active ? T.accent : T.textSecondary,
              textShadow: active ? T.textGlow : 'none',
              cursor: 'pointer', fontSize: '11px', fontFamily: T.fontMono,
              letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
            }}>{label}</button>
          )
        })}
      </div>

      {list.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: '13px', fontFamily: T.fontMono }}>
          {tab === 'received' ? 'No tasks assigned to you yet.' : "You haven't assigned any tasks yet."}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pending.map(a => (
            <AssignmentRow key={a.id} assignment={a} isMobile={isMobile} mode={tab}
              onMarkDone={tab === 'received' ? markDone : undefined}
              onRequestUpdate={tab === 'sent' ? requestUpdate : undefined} />
          ))}
          {completed.length > 0 && pending.length > 0 && (
            <div style={{ borderTop: '1px solid ' + T.borderSubtle, margin: '8px 0' }} />
          )}
          {completed.map(a => (
            <AssignmentRow key={a.id} assignment={a} isMobile={isMobile} mode={tab}
              onMarkDone={tab === 'received' ? markDone : undefined}
              onRequestUpdate={tab === 'sent' ? requestUpdate : undefined} />
          ))}
        </div>
      )}
    </div>
  )
}

function AssignmentRow({ assignment, isMobile, mode, onMarkDone, onRequestUpdate }) {
  const done = assignment.status === 'completed'
  return (
    <div style={{
      backgroundColor: done ? T.bgInput : T.bgSurfaceAlt,
      border: '1px solid ' + T.borderSubtle,
      borderRadius: T.rMd,
      padding: isMobile ? '12px 14px' : '14px 16px',
      opacity: done ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <span style={{ fontSize: isMobile ? '13px' : '14px', color: T.textPrimary, fontFamily: T.fontMono, textDecoration: done ? 'line-through' : 'none', wordBreak: 'break-word' }}>
          {assignment.title}
        </span>
        {!done && onMarkDone && (
          <button
            onClick={() => onMarkDone(assignment.id)}
            style={{ flexShrink: 0, backgroundColor: T.accentGlow, border: '1px solid ' + T.accentMuted, borderRadius: '4px', color: T.accent, cursor: 'pointer', fontSize: '11px', fontFamily: T.fontMono, padding: '4px 9px', whiteSpace: 'nowrap' }}
          >✓ Mark done</button>
        )}
        {!done && onRequestUpdate && (
          <button
            onClick={() => onRequestUpdate(assignment.id)}
            title={assignment.update_requested_at ? `Last requested ${new Date(assignment.update_requested_at).toLocaleString()}` : 'Ping the assignee for a status update'}
            style={{ flexShrink: 0, backgroundColor: 'transparent', border: '1px solid ' + T.borderSubtle, borderRadius: '4px', color: T.textSecondary, cursor: 'pointer', fontSize: '11px', fontFamily: T.fontMono, padding: '4px 9px', whiteSpace: 'nowrap' }}
          >{assignment.update_requested_at ? '↻ Update requested' : '↻ Request update'}</button>
        )}
      </div>
      {assignment.description && (
        <div style={{ fontSize: '12px', color: T.textSecondary, fontFamily: T.fontMono, marginTop: '6px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
          {assignment.description}
        </div>
      )}
      <div style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontMono, marginTop: '8px', letterSpacing: '0.04em' }}>
        ▸ {mode === 'received' ? `Assigned by ${assignment.assigner_email}` : `Assigned to ${assignment.assignee_email}`}
      </div>
    </div>
  )
}
