import { useEffect, useState } from 'react'
import { T } from '../lib/theme'
import { getMyAssignments, updateAssignmentStatus } from '../lib/assignmentsApi'

export default function AssignedToMeView({ isMobile }) {
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyAssignments().then(list => { setAssignments(list); setLoading(false) })
  }, [])

  async function markDone(id) {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'completed' } : a))
    try { await updateAssignmentStatus(id, 'completed') }
    catch { setAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'pending' } : a)) }
  }

  const pending = assignments.filter(a => a.status !== 'completed')
  const completed = assignments.filter(a => a.status === 'completed')

  if (loading) {
    return <div style={{ padding: '24px 12px', color: T.textMuted, fontSize: '13px', fontFamily: T.fontMono, textAlign: 'center' }}>Loading…</div>
  }

  if (assignments.length === 0) {
    return (
      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px', textAlign: 'center', color: T.textMuted, fontSize: '13px', fontFamily: T.fontMono }}>
        No tasks assigned to you yet.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {pending.map(a => <AssignmentRow key={a.id} assignment={a} isMobile={isMobile} onMarkDone={markDone} />)}
      {completed.length > 0 && pending.length > 0 && (
        <div style={{ borderTop: '1px solid ' + T.borderSubtle, margin: '8px 0' }} />
      )}
      {completed.map(a => <AssignmentRow key={a.id} assignment={a} isMobile={isMobile} onMarkDone={markDone} />)}
    </div>
  )
}

function AssignmentRow({ assignment, isMobile, onMarkDone }) {
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
        {!done && (
          <button
            onClick={() => onMarkDone(assignment.id)}
            style={{ flexShrink: 0, backgroundColor: T.accentGlow, border: '1px solid ' + T.accentMuted, borderRadius: '4px', color: T.accent, cursor: 'pointer', fontSize: '11px', fontFamily: T.fontMono, padding: '4px 9px', whiteSpace: 'nowrap' }}
          >✓ Mark done</button>
        )}
      </div>
      {assignment.description && (
        <div style={{ fontSize: '12px', color: T.textSecondary, fontFamily: T.fontMono, marginTop: '6px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
          {assignment.description}
        </div>
      )}
      <div style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontMono, marginTop: '8px', letterSpacing: '0.04em' }}>
        ▸ Assigned by {assignment.assigner_email}
      </div>
    </div>
  )
}
