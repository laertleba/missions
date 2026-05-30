import { useState } from 'react'
import { T } from '../lib/theme'
import { fmtTime } from '../lib/utils'

function Chk({ done, onClick, size = 18 }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, minWidth: size,
        borderRadius: '4px',
        border: '2px solid ' + (done ? T.accent : T.textMuted),
        backgroundColor: done ? T.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: T.trF, flexShrink: 0,
      }}
    >
      {done && (
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 10 10" fill="none">
          <path d="M2 5L4.5 7.5L8 3" stroke="#06140b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

function metaLabel(m) {
  const parts = []
  if (m.scheduledDate) {
    const d = new Date(m.scheduledDate + 'T00:00:00')
    parts.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
  }
  if (m.startTime != null) parts.push(fmtTime(m.startTime) + '–' + fmtTime(m.endTime))
  return parts.join(' · ')
}

function MissionNode({ mission, childrenByParent, collapsed, onToggleCollapse, depth, handlers, isMobile }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const kids = childrenByParent[mission.id] || []
  const hasKids = kids.length > 0
  const isOpen = !collapsed.has(mission.id)
  const done = mission.completed
  const meta = metaLabel(mission)
  const fs = isMobile ? '12px' : '13.5px'
  const pad = isMobile ? '6px 8px' : '8px 10px'

  function submitSub() {
    const t = draft.trim()
    if (!t) return
    handlers.onAddSub(mission, t)
    setDraft(''); setAdding(false)
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px',
          padding: pad,
          backgroundColor: done ? T.bgInput : T.bgSurfaceAlt,
          border: '1px solid ' + T.borderSubtle,
          borderRadius: '5px',
          opacity: done ? 0.6 : 1,
          transition: 'all ' + T.trF,
        }}
      >
        <button
          onClick={() => hasKids && onToggleCollapse(mission.id)}
          style={{
            width: 14, minWidth: 14, backgroundColor: 'transparent', border: 'none',
            color: hasKids ? T.accent : 'transparent',
            cursor: hasKids ? 'pointer' : 'default',
            fontSize: '10px', fontFamily: T.fontMono, padding: 0,
            transition: 'transform ' + T.trF,
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >▸</button>

        <Chk done={done} onClick={() => handlers.onToggle(mission)} size={isMobile ? 16 : 18} />

        {/* Clickable title → edit modal */}
        <span
          onClick={() => handlers.onEdit && handlers.onEdit(mission)}
          title="Click to edit"
          style={{
            flex: 1, minWidth: 0,
            fontSize: fs,
            color: T.textPrimary,
            textDecoration: done ? 'line-through' : 'none',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            cursor: handlers.onEdit ? 'pointer' : 'default',
          }}
        >
          {mission.title}
        </span>

        {meta && (
          <span style={{ fontSize: isMobile ? '9px' : '10px', color: T.textMuted, fontFamily: T.fontMono, whiteSpace: 'nowrap', flexShrink: 0 }}>
            {meta}
          </span>
        )}

        {!isMobile && (
          <button
            onClick={() => setAdding(a => !a)}
            title="Add sub-mission"
            style={{
              flexShrink: 0, backgroundColor: 'transparent',
              border: '1px solid ' + T.borderSubtle, borderRadius: '4px',
              color: T.textSecondary, cursor: 'pointer',
              fontSize: '10px', fontFamily: T.fontMono,
              padding: '1px 5px', lineHeight: '1.4',
            }}
          >+↳</button>
        )}

        <button
          onClick={() => handlers.onDelete(mission)}
          style={{
            flexShrink: 0, backgroundColor: 'transparent', border: 'none',
            color: T.textMuted, cursor: 'pointer',
            fontSize: isMobile ? '13px' : '14px', lineHeight: '1', padding: '0 2px',
          }}
        >×</button>
      </div>

      {adding && (
        <div style={{ display: 'flex', gap: '6px', margin: '4px 0 2px 22px' }}>
          <input
            autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitSub(); if (e.key === 'Escape') { setAdding(false); setDraft('') } }}
            placeholder="New sub-mission…"
            style={{
              flex: 1, backgroundColor: T.bgInput,
              border: '1px solid ' + T.accentMuted, borderRadius: '4px',
              padding: '6px 9px', color: T.textPrimary,
              fontSize: '12px', fontFamily: T.fontMono, outline: 'none',
            }}
          />
          <button onClick={submitSub} style={{ backgroundColor: T.accent, border: 'none', borderRadius: '4px', padding: '0 12px', color: '#06140b', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
            Add
          </button>
        </div>
      )}

      {hasKids && (
        <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows ' + T.trM }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ marginLeft: isMobile ? '10px' : '14px', paddingLeft: isMobile ? '8px' : '14px', borderLeft: '1px solid ' + T.borderSubtle, marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {kids.map(child => (
                <MissionNode key={child.id} mission={child} childrenByParent={childrenByParent} collapsed={collapsed} onToggleCollapse={onToggleCollapse} depth={depth + 1} handlers={handlers} isMobile={isMobile} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MissionTree({ topLevel, childrenByParent, handlers, isMobile = false, emptyMessage }) {
  const [collapsed, setCollapsed] = useState(() => new Set())

  function onToggleCollapse(id) {
    setCollapsed(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  if (topLevel.length === 0) {
    return (
      <div style={{ padding: '24px 12px', color: T.textMuted, fontSize: isMobile ? '11px' : '13px', fontFamily: T.fontMono, textAlign: 'center' }}>
        {emptyMessage || 'No missions logged. Add the first objective above.'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {topLevel.map(m => (
        <MissionNode key={m.id} mission={m} childrenByParent={childrenByParent} collapsed={collapsed} onToggleCollapse={onToggleCollapse} depth={0} handlers={handlers} isMobile={isMobile} />
      ))}
    </div>
  )
}
