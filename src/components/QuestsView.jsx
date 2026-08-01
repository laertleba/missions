import { useState, useRef, useEffect } from 'react'
import { T } from '../lib/theme'
import MissionTree from './MissionTree'

export default function QuestsView({
  quests, childrenByParent, selectedQuestId, onSelectQuest,
  questFilter, setQuestFilter, isMobile,
  onAddQuest, onCompleteQuest, onReactivateQuest, onDeleteQuest,
  onAddTopMission, onRenameQuest, onUpdateQuestDescription, missionHandlers,
}) {
  const [questDraft, setQuestDraft] = useState('')
  const [missionDraft, setMissionDraft] = useState('')
  const [addToToday, setAddToToday] = useState(false)
  // Inline quest rename state
  const [editingTitle, setEditingTitle] = useState(null) // null | string
  const titleInputRef = useRef(null)
  // Inline quest description state
  const [editingDescription, setEditingDescription] = useState(null) // null | string
  const descriptionInputRef = useRef(null)

  const visibleQuests = quests.filter(q => (questFilter === 'archived' ? q.archived : !q.archived))
  // Only treat a quest as selected if it belongs to the current filter tab
  const selected = quests.find(q => q.id === selectedQuestId && (questFilter === 'archived' ? !!q.archived : !q.archived)) || null
  const topLevel = selected ? childrenByParent[selected.id] || [] : []

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitle !== null) titleInputRef.current?.focus()
  }, [editingTitle !== null]) // eslint-disable-line

  // Focus description input when editing starts
  useEffect(() => {
    if (editingDescription !== null) descriptionInputRef.current?.focus()
  }, [editingDescription !== null]) // eslint-disable-line

  // Discard any open rename/description edit when switching quests
  useEffect(() => {
    setEditingTitle(null)
    setEditingDescription(null)
  }, [selectedQuestId])

  function submitQuest() {
    const t = questDraft.trim(); if (!t) return
    onAddQuest(t); setQuestDraft('')
  }
  function submitMission() {
    const t = missionDraft.trim(); if (!t || !selected) return
    const scheduledDate = addToToday ? new Date().toISOString().slice(0, 10) : null
    onAddTopMission(selected, t, scheduledDate); setMissionDraft('')
  }
  function commitRename() {
    if (editingTitle !== null && editingTitle.trim() && selected) {
      onRenameQuest(selected.id, editingTitle.trim())
    }
    setEditingTitle(null)
  }
  function commitDescription() {
    if (editingDescription !== null && selected) {
      onUpdateQuestDescription(selected.id, editingDescription.trim())
    }
    setEditingDescription(null)
  }

  const fs = { // responsive font sizes
    label: isMobile ? '10px' : '11px',
    questItem: isMobile ? '12px' : '13px',
    detail: isMobile ? '14px' : '18px',
    btn: isMobile ? '10px' : '11px',
    meta: isMobile ? '9px' : '10px',
  }

  // ── Left: quest log ──
  const questLog = (
    <div style={{
      width: isMobile ? '100%' : '280px',
      flexShrink: 0,
      backgroundColor: T.bgSurface,
      border: '1px solid ' + T.borderSubtle,
      borderRadius: T.rMd,
      padding: isMobile ? '12px' : '14px',
      alignSelf: 'flex-start',
    }}>
      <div style={{ fontSize: fs.label, color: T.accent, fontFamily: T.fontMono, letterSpacing: '0.16em', textTransform: 'uppercase', textShadow: T.textGlow, marginBottom: '10px' }}>
        ▌ Quest Log
      </div>

      {/* filter toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
        {[['active', 'Active'], ['archived', 'History']].map(([val, label]) => {
          const active = questFilter === val
          return (
            <button key={val} onClick={() => setQuestFilter(val)} style={{
              flex: 1, backgroundColor: active ? T.accentGlow : 'transparent',
              border: '1px solid ' + (active ? T.accentMuted : T.borderSubtle),
              borderRadius: '3px', padding: isMobile ? '5px 6px' : '6px 8px',
              color: active ? T.accent : T.textSecondary, cursor: 'pointer',
              fontSize: fs.btn, fontFamily: T.fontMono,
              letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>{label}</button>
          )
        })}
      </div>

      {questFilter === 'active' && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
          <input
            value={questDraft}
            onChange={e => setQuestDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitQuest() }}
            placeholder="New quest…"
            style={{
              flex: 1, backgroundColor: T.bgInput,
              border: '1px solid ' + T.borderSubtle, borderRadius: '4px',
              padding: isMobile ? '7px 9px' : '8px 10px',
              color: T.textPrimary, fontSize: fs.questItem,
              fontFamily: T.fontMono, outline: 'none',
            }}
          />
          <button onClick={submitQuest} style={{ backgroundColor: T.accent, border: 'none', borderRadius: '4px', padding: '0 12px', color: '#06140b', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>+</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {visibleQuests.length === 0 && (
          <div style={{ color: T.textMuted, fontSize: fs.questItem, fontFamily: T.fontMono, padding: '10px 4px' }}>
            {questFilter === 'archived' ? 'No completed quests yet.' : 'No active quests. Create one above.'}
          </div>
        )}
        {visibleQuests.map(q => {
          const isSel = q.id === selectedQuestId
          const total = (childrenByParent[q.id] || []).length
          return (
            <button key={q.id} onClick={() => onSelectQuest(q.id)} style={{
              textAlign: 'left',
              backgroundColor: isSel ? T.accentGlow : 'transparent',
              border: '1px solid ' + (isSel ? T.accent : T.borderSubtle),
              borderRadius: '4px', padding: isMobile ? '8px 10px' : '10px 12px',
              color: isSel ? T.accent : T.textPrimary, cursor: 'pointer',
              fontSize: fs.questItem, fontFamily: T.fontMono,
              boxShadow: isSel ? 'inset 0 0 12px rgba(43,255,136,0.12), ' + T.shGlow : 'none',
              textShadow: isSel ? T.textGlow : 'none',
              transition: 'all ' + T.trF,
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{ flexShrink: 0, opacity: 0.7 }}>{q.archived ? '✓' : isSel ? '▸' : '·'}</span>
              <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: q.archived ? 'line-through' : 'none', opacity: q.archived ? 0.7 : 1 }}>
                {q.title}
              </span>
              <span style={{ flexShrink: 0, fontSize: fs.meta, color: T.textMuted }}>{total}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── Right: quest detail ──
  const detail = (
    <div style={{
      flex: 1, minWidth: 0,
      backgroundColor: T.bgSurface,
      border: '1px solid ' + T.borderSubtle,
      borderRadius: T.rMd,
      padding: isMobile ? '14px' : '20px',
    }}>
      {!selected ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted, fontSize: '13px', fontFamily: T.fontMono }}>
          ◈ Select a quest from the log to view its missions.
        </div>
      ) : (
        <>
          {/* Header with inline rename */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '16px', paddingBottom: '14px', borderBottom: '1px solid ' + T.borderSubtle }}>
            {editingTitle !== null ? (
              <input
                ref={titleInputRef}
                value={editingTitle}
                onChange={e => setEditingTitle(e.target.value)}
                onBlur={commitRename}
                onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setEditingTitle(null) }}
                style={{
                  flex: 1, minWidth: '120px',
                  backgroundColor: T.bgInput,
                  border: '1px solid ' + T.accent,
                  borderRadius: '4px',
                  padding: '4px 8px',
                  color: T.accent,
                  fontSize: fs.detail,
                  fontFamily: T.fontMono,
                  fontWeight: '700',
                  outline: 'none',
                  textShadow: T.textGlow,
                }}
              />
            ) : (
              <>
                <h2 style={{
                  flex: 1, minWidth: '120px', margin: 0,
                  fontSize: fs.detail, fontFamily: T.fontMono,
                  color: selected.archived ? T.textSecondary : T.accent,
                  textShadow: selected.archived ? 'none' : T.textGlow,
                  letterSpacing: '0.04em',
                  textDecoration: selected.archived ? 'line-through' : 'none',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {selected.title}
                </h2>
                {!selected.archived && (
                  <button
                    onClick={() => setEditingTitle(selected.title)}
                    title="Rename quest"
                    style={{
                      flexShrink: 0, backgroundColor: 'transparent',
                      border: '1px solid ' + T.borderSubtle, borderRadius: '4px',
                      padding: '4px 8px', color: T.textMuted, cursor: 'pointer',
                      fontSize: '12px', lineHeight: 1,
                    }}
                  >✏️</button>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
              {editingTitle !== null ? (
                <button onClick={commitRename} style={actionBtnStyle(T.accent, T.accentGlow, fs.btn)}>✓ Confirm</button>
              ) : selected.archived ? (
                <button onClick={() => onReactivateQuest(selected)} style={actionBtnStyle(T.amber, T.amberGlow, fs.btn)}>↺ Reactivate</button>
              ) : (
                <>
                  <button onClick={() => onCompleteQuest(selected)} style={actionBtnStyle(T.accent, T.accentGlow, fs.btn)}>✓ Complete</button>
                  <button onClick={() => { if (window.confirm(`Delete quest "${selected.title}" and all its missions?`)) onDeleteQuest(selected) }} style={actionBtnStyle(T.textMuted, 'transparent', fs.btn)}>✕ Delete</button>
                </>
              )}
            </div>
          </div>

          {/* Optional quest description */}
          <div style={{ marginBottom: '16px' }}>
            {editingDescription !== null ? (
              <textarea
                ref={descriptionInputRef}
                value={editingDescription}
                onChange={e => setEditingDescription(e.target.value)}
                onBlur={commitDescription}
                onKeyDown={e => { if (e.key === 'Escape') setEditingDescription(null) }}
                placeholder="Optional quest description…"
                rows={2}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  backgroundColor: T.bgInput,
                  border: '1px solid ' + T.accentMuted,
                  borderRadius: '4px',
                  padding: '8px 10px',
                  color: T.textPrimary,
                  fontSize: fs.questItem,
                  fontFamily: T.fontMono,
                  outline: 'none',
                  lineHeight: '1.5',
                  resize: 'vertical',
                }}
              />
            ) : selected.description ? (
              <div
                onClick={() => !selected.archived && setEditingDescription(selected.description)}
                title={selected.archived ? undefined : 'Click to edit'}
                style={{
                  fontSize: fs.questItem, color: T.textSecondary, fontFamily: T.fontMono,
                  lineHeight: '1.5', whiteSpace: 'pre-wrap', cursor: selected.archived ? 'default' : 'pointer',
                }}
              >
                {selected.description}
              </div>
            ) : !selected.archived && (
              <button
                onClick={() => setEditingDescription('')}
                style={{
                  background: 'transparent', border: 'none', color: T.textMuted, cursor: 'pointer',
                  fontSize: fs.meta, fontFamily: T.fontMono, padding: 0, letterSpacing: '0.04em',
                }}
              >+ Add description</button>
            )}
          </div>

          {/* Add top-level mission */}
          {!selected.archived && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '14px' }}>
              <input
                value={missionDraft}
                onChange={e => setMissionDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitMission() }}
                placeholder="Add mission to this quest…"
                style={{
                  flex: 1, backgroundColor: T.bgInput,
                  border: '1px solid ' + T.borderSubtle, borderRadius: '4px',
                  padding: isMobile ? '8px 10px' : '9px 12px',
                  color: T.textPrimary, fontSize: isMobile ? '13px' : '13px',
                  fontFamily: T.fontMono, outline: 'none',
                }}
              />
              <button onClick={() => setAddToToday(x => !x)} title="Add to today" style={{ flexShrink: 0, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 4px', color: addToToday ? T.accent : T.textMuted, textShadow: addToToday ? T.textGlow : 'none', transition: 'color 0.15s' }}>⊕</button>
              <button onClick={submitMission} style={{ backgroundColor: T.accent, border: 'none', borderRadius: '4px', padding: '0 14px', color: '#06140b', fontSize: '15px', fontWeight: '700', cursor: 'pointer' }}>+</button>
            </div>
          )}

          <MissionTree topLevel={topLevel} childrenByParent={childrenByParent} handlers={missionHandlers} isMobile={isMobile} deprioritizeCompleted sortable />
        </>
      )}
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '14px', maxWidth: '1200px', margin: '0 auto', alignItems: 'flex-start' }}>
      {questLog}
      {detail}
    </div>
  )
}

function actionBtnStyle(color, bg, fontSize) {
  return {
    backgroundColor: bg,
    border: '1px solid ' + color,
    borderRadius: '4px',
    padding: '5px 10px',
    color,
    cursor: 'pointer',
    fontSize,
    fontFamily: T.fontMono,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  }
}
