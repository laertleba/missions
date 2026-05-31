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

function MissionNode({ mission, questLabel, childrenByParent, collapsed, onToggleCollapse, depth, handlers, isMobile, deprioritizeCompleted, dragCtx }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const kidsRaw = childrenByParent[mission.id] || []
  const kids = deprioritizeCompleted
    ? [...kidsRaw].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
    : kidsRaw
  const hasKids = kids.length > 0
  const isOpen = !collapsed.has(mission.id)
  const done = mission.completed
  const starred = !!mission.starred
  const meta = metaLabel(mission)
  const todayStr = getDateStr(new Date())
  const isToday = mission.scheduledDate === todayStr
  const fs = isMobile ? '12px' : '13.5px'
  const pad = isMobile ? '6px 8px' : '8px 10px'

  const isDragging = !!dragCtx && dragCtx.dragging?.id === mission.id
  const isDragOver = !!dragCtx && dragCtx.dragOverId === mission.id

  function submitSub() {
    const t = draft.trim()
    if (!t) return
    handlers.onAddSub(mission, t)
    setDraft(''); setAdding(false)
  }

  return (
    <div
      style={{ position: 'relative', opacity: isDragging ? 0.4 : 1 }}
      onDragOver={e => { e.preventDefault(); e.stopPropagation(); dragCtx?.onDragOver(mission.id) }}
      onDrop={e => { e.preventDefault(); e.stopPropagation(); dragCtx?.onDropOn(mission) }}
    >
      {/* Drop indicator line */}
      {isDragOver && (
        <div style={{ height: '2px', backgroundColor: T.accent, borderRadius: '2px', marginBottom: '2px', boxShadow: T.textGlow }} />
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: isMobile ? '6px' : '8px',
          padding: pad,
          backgroundColor: starred ? 'rgba(255,179,64,0.06)' : (done ? T.bgInput : T.bgSurfaceAlt),
          border: '1px solid ' + (starred ? 'rgba(255,179,64,0.35)' : T.borderSubtle),
          borderRadius: '5px',
          opacity: done ? 0.65 : 1,
          transition: 'all ' + T.trF,
        }}
      >
        {/* Drag handle — only rendered when dragCtx is active (sortable tree) */}
        {dragCtx && (
          <span
            draggable
            onDragStart={e => { e.stopPropagation(); dragCtx.onDragStart(mission) }}
            onDragEnd={() => dragCtx.onDragEnd()}
            title="Drag to reorder"
            style={{
              flexShrink: 0, marginTop: '3px',
              color: T.textMuted, cursor: 'grab',
              fontSize: '11px', lineHeight: 1,
              userSelect: 'none', opacity: 0.5,
            }}
          >⠿</span>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => hasKids && onToggleCollapse(mission.id)}
          style={{
            width: 14, minWidth: 14, marginTop: '2px',
            backgroundColor: 'transparent', border: 'none',
            color: hasKids ? T.accent : 'transparent',
            cursor: hasKids ? 'pointer' : 'default',
            fontSize: '10px', fontFamily: T.fontMono, padding: 0,
            transition: 'transform ' + T.trF,
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >▸</button>

        <Chk done={done} onClick={() => handlers.onToggle(mission)} size={isMobile ? 16 : 18} />

        {/* Title + quest label */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span
            onClick={() => handlers.onEdit && handlers.onEdit(mission)}
            title="Click to edit"
            style={{
              fontSize: fs,
              color: T.textPrimary,
              textDecoration: done ? 'line-through' : 'none',
              lineHeight: '1.45',
              wordBreak: 'break-word',
              cursor: handlers.onEdit ? 'pointer' : 'default',
            }}
          >
            {mission.title}
          </span>
          {questLabel && (
            <span style={{ fontSize: '9px', color: T.textMuted, fontFamily: T.fontMono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              ▸ {questLabel}
            </span>
          )}
        </div>

        {meta && (
          <span style={{ fontSize: isMobile ? '9px' : '10px', color: T.textMuted, fontFamily: T.fontMono, whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px' }}>
            {meta}
          </span>
        )}

        {handlers.onToday && (
          <button onClick={() => handlers.onToday(mission)} title="Add to my day" style={{ flexShrink: 0, backgroundColor: 'transparent', border: 'none', color: isToday ? T.accent : T.textMuted, cursor: 'pointer', fontSize: isMobile ? '13px' : '14px', lineHeight: '1', padding: '0 1px', textShadow: isToday ? T.textGlow : 'none', transition: 'color ' + T.trF }}>⊕</button>
        )}

        <button onClick={() => handlers.onStar && handlers.onStar(mission)} title={starred ? 'Unstar' : 'Mark as important'} style={{ flexShrink: 0, backgroundColor: 'transparent', border: 'none', color: starred ? T.amber : T.textMuted, cursor: 'pointer', fontSize: isMobile ? '13px' : '14px', lineHeight: '1', padding: '0 1px', textShadow: starred ? '0 0 6px rgba(255,179,64,0.55)' : 'none', transition: 'color ' + T.trF }}>{starred ? '★' : '☆'}</button>

        <button onClick={() => setAdding(a => !a)} title="Add sub-mission" style={{ flexShrink: 0, backgroundColor: 'transparent', border: '1px solid ' + T.borderSubtle, borderRadius: '4px', color: T.textSecondary, cursor: 'pointer', fontSize: '10px', fontFamily: T.fontMono, padding: '1px 5px', lineHeight: '1.4' }}>+↳</button>

        <button
          onClick={() => {
            const kidsCount = (childrenByParent[mission.id] || []).length
            const msg = kidsCount ? `Delete "${mission.title}" and its ${kidsCount} sub-mission(s)?` : `Delete "${mission.title}"?`
            if (window.confirm(msg)) handlers.onDelete(mission)
          }}
          style={{ flexShrink: 0, backgroundColor: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer', fontSize: isMobile ? '13px' : '14px', lineHeight: '1', padding: '0 2px' }}
        >×</button>
      </div>

      {adding && (
        <div style={{ display: 'flex', gap: '6px', margin: '4px 0 2px 22px' }}>
          <input
            autoFocus value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitSub(); if (e.key === 'Escape') { setAdding(false); setDraft('') } }}
            placeholder="New sub-mission…"
            style={{ flex: 1, backgroundColor: T.bgInput, border: '1px solid ' + T.accentMuted, borderRadius: '4px', padding: '6px 9px', color: T.textPrimary, fontSize: '12px', fontFamily: T.fontMono, outline: 'none' }}
          />
          <button onClick={submitSub} style={{ backgroundColor: T.accent, border: 'none', borderRadius: '4px', padding: '0 12px', color: '#06140b', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>Add</button>
        </div>
      )}

      {hasKids && (
        <div style={{ display: 'grid', gridTemplateRows: isOpen ? '1fr' : '0fr', transition: 'grid-template-rows ' + T.trM }}>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ marginLeft: isMobile ? '10px' : '14px', paddingLeft: isMobile ? '8px' : '14px', borderLeft: '1px solid ' + T.borderSubtle, marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {kids.map(child => (
                <MissionNode key={child.id} mission={child} childrenByParent={childrenByParent} collapsed={collapsed} onToggleCollapse={onToggleCollapse} depth={depth + 1} handlers={handlers} isMobile={isMobile} deprioritizeCompleted={deprioritizeCompleted} dragCtx={dragCtx} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MissionTree({ topLevel, childrenByParent, handlers, isMobile = false, emptyMessage, questLabels, deprioritizeCompleted, sortable = false }) {
  const [collapsed, setCollapsed] = useState(() => new Set())
  const [dragging, setDragging] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  function onToggleCollapse(id) {
    setCollapsed(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  function handleDropOn(targetMission) {
    if (!dragging || dragging.id === targetMission.id) { reset(); return }
    if (dragging.parentId !== targetMission.parentId) { reset(); return }

    const siblings = childrenByParent[dragging.parentId] || []
    const without = siblings.filter(s => s.id !== dragging.id)
    const tIdx = without.findIndex(s => s.id === targetMission.id)
    if (tIdx === -1) { reset(); return }

    const reordered = [...without.slice(0, tIdx), dragging, ...without.slice(tIdx)]
    handlers.onReorder && handlers.onReorder(dragging.parentId, reordered.map(s => s.id))
    reset()
  }

  function reset() { setDragging(null); setDragOverId(null) }

  // Only expose dragCtx when sortable=true; passing null disables the drag handle
  const dragCtx = sortable ? {
    dragging, dragOverId,
    onDragStart: m => setDragging(m),
    onDragOver: id => setDragOverId(id),
    onDropOn: handleDropOn,
    onDragEnd: reset,
  } : null

  const sortedTopLevel = deprioritizeCompleted
    ? [...topLevel].sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1))
    : topLevel

  if (sortedTopLevel.length === 0) {
    return (
      <div style={{ padding: '24px 12px', color: T.textMuted, fontSize: isMobile ? '11px' : '13px', fontFamily: T.fontMono, textAlign: 'center' }}>
        {emptyMessage || 'No missions logged. Add the first objective above.'}
      </div>
    )
  }

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
      onDragLeave={() => setDragOverId(null)}
    >
      {sortedTopLevel.map(m => (
        <MissionNode
          key={m.id}
          mission={m}
          questLabel={questLabels ? questLabels.get(m.id) : undefined}
          childrenByParent={childrenByParent}
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          depth={0}
          handlers={handlers}
          isMobile={isMobile}
          deprioritizeCompleted={deprioritizeCompleted}
          dragCtx={dragCtx}
        />
      ))}
    </div>
  )
}
