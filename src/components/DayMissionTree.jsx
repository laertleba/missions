import { useState } from 'react'
import { T } from '../lib/theme'
import { fmtTime, getDateStr } from '../lib/utils'

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

const abtn = {
  backgroundColor: 'transparent', border: 'none',
  cursor: 'pointer', lineHeight: '1', padding: '0 3px',
  transition: 'color 0.15s ease',
}
const abtnBordered = {
  backgroundColor: 'transparent', borderRadius: '4px',
  cursor: 'pointer', fontSize: '10px',
  fontFamily: 'ui-monospace,monospace',
  padding: '1px 5px', lineHeight: '1.4',
}

function DayMissionNode({ mission, questLabel, childrenByParent, collapsed, onToggleCollapse, depth, handlers, isMobile }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const kids = childrenByParent[mission.id] || []
  const hasKids = kids.length > 0
  const isOpen = !collapsed.has(mission.id)
  const done = mission.completed
  const starred = !!mission.starred
  const meta = metaLabel(mission)
  const todayStr = getDateStr(new Date())
  const isToday = mission.scheduledDate === todayStr
  // Slightly smaller title text on PC to fit narrow weekly columns
  const fs = isMobile ? '12px' : '12px'
  const pad = isMobile ? '6px 8px' : '7px 9px'

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
          display: 'flex',
          alignItems: 'flex-start',
          gap: isMobile ? '6px' : '7px',
          padding: pad,
          backgroundColor: starred ? 'rgba(255,179,64,0.06)' : (done ? T.bgInput : T.bgSurfaceAlt),
          border: '1px solid ' + (starred ? 'rgba(255,179,64,0.35)' : T.borderSubtle),
          borderRadius: '5px',
          opacity: done ? 0.65 : 1,
          transition: 'all ' + T.trF,
        }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => hasKids && onToggleCollapse(mission.id)}
          style={{
            width: 14, minWidth: 14, marginTop: '3px',
            backgroundColor: 'transparent', border: 'none',
            color: hasKids ? T.accent : 'transparent',
            cursor: hasKids ? 'pointer' : 'default',
            fontSize: '10px', fontFamily: T.fontMono, padding: 0,
            transition: 'transform ' + T.trF,
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >▸</button>

        <Chk done={done} onClick={() => handlers.onToggle(mission)} size={isMobile ? 16 : 16} />

        {/* Content column: title → actions → quest label */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Title — full width, wraps freely */}
          <span
            onClick={() => handlers.onEdit && handlers.onEdit(mission)}
            title="Click to edit"
            style={{
              display: 'block',
              fontSize: fs,
              color: T.textPrimary,
              textDecoration: done ? 'line-through' : 'none',
              lineHeight: '1.4',
              wordBreak: 'break-word',
              cursor: handlers.onEdit ? 'pointer' : 'default',
            }}
          >
            {mission.title}
          </span>

          {/* Actions bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', marginTop: '4px', flexWrap: 'wrap' }}>
            {meta && (
              <span style={{ fontSize: '9px', color: T.textMuted, fontFamily: T.fontMono, marginRight: '4px', whiteSpace: 'nowrap' }}>
                {meta}
              </span>
            )}

            {handlers.onToday && (
              <button
                onClick={() => handlers.onToday(mission)}
                title="Add to my day"
                style={{ ...abtn, fontSize: '13px', color: isToday ? T.accent : T.textMuted, textShadow: isToday ? T.textGlow : 'none' }}
              >⊕</button>
            )}

            <button
              onClick={() => handlers.onStar && handlers.onStar(mission)}
              title={starred ? 'Unstar' : 'Mark as important'}
              style={{ ...abtn, fontSize: '13px', color: starred ? T.amber : T.textMuted, textShadow: starred ? '0 0 6px rgba(255,179,64,0.55)' : 'none' }}
            >{starred ? '★' : '☆'}</button>

            <button
              onClick={() => setAdding(a => !a)}
              title="Add sub-mission"
              style={{ ...abtnBordered, border: '1px solid ' + T.borderSubtle, color: T.textSecondary }}
            >+↳</button>

            <button
              onClick={() => {
                const kidsCount = (childrenByParent[mission.id] || []).length
                const msg = kidsCount
                  ? `Delete "${mission.title}" and its ${kidsCount} sub-mission(s)?`
                  : `Delete "${mission.title}"?`
                if (window.confirm(msg)) handlers.onDelete(mission)
              }}
              style={{ ...abtn, fontSize: '14px', color: T.textMuted }}
            >×</button>
          </div>

          {/* Quest label */}
          {questLabel && (
            <span style={{
              display: 'block', marginTop: '3px',
              fontSize: '9px', color: T.textMuted,
              fontFamily: T.fontMono, letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              ▸ {questLabel}
            </span>
          )}
        </div>
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
            <div style={{ marginLeft: isMobile ? '10px' : '12px', paddingLeft: isMobile ? '8px' : '10px', borderLeft: '1px solid ' + T.borderSubtle, marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {kids.map(child => (
                <DayMissionNode key={child.id} mission={child} childrenByParent={childrenByParent} collapsed={collapsed} onToggleCollapse={onToggleCollapse} depth={depth + 1} handlers={handlers} isMobile={isMobile} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DayMissionTree({ topLevel, childrenByParent, handlers, isMobile = false, emptyMessage, questLabels }) {
  const [collapsed, setCollapsed] = useState(() => new Set())

  function onToggleCollapse(id) {
    setCollapsed(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  if (topLevel.length === 0) {
    return (
      <div style={{ padding: '16px 8px', color: T.textMuted, fontSize: '11px', fontFamily: T.fontMono, textAlign: 'center' }}>
        {emptyMessage || 'No missions'}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {topLevel.map(m => (
        <DayMissionNode
          key={m.id}
          mission={m}
          questLabel={questLabels ? questLabels.get(m.id) : undefined}
          childrenByParent={childrenByParent}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          depth={0}
          handlers={handlers}
          isMobile={isMobile}
        />
      ))}
    </div>
  )
}
