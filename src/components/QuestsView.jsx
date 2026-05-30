import { useState } from 'react'
import { T } from '../lib/theme'
import MissionTree from './MissionTree'

export default function QuestsView({
  quests, childrenByParent, selectedQuestId, onSelectQuest,
  questFilter, setQuestFilter, isMobile,
  onAddQuest, onCompleteQuest, onReactivateQuest, onDeleteQuest,
  onAddTopMission, missionHandlers,
}) {
  const [questDraft, setQuestDraft] = useState('')
  const [missionDraft, setMissionDraft] = useState('')

  const visibleQuests = quests.filter(q => (questFilter === 'archived' ? q.archived : !q.archived))
  const selected = quests.find(q => q.id === selectedQuestId) || null
  const topLevel = selected ? childrenByParent[selected.id] || [] : []

  function submitQuest() {
    const t = questDraft.trim()
    if (!t) return
    onAddQuest(t)
    setQuestDraft('')
  }
  function submitMission() {
    const t = missionDraft.trim()
    if (!t || !selected) return
    onAddTopMission(selected, t)
    setMissionDraft('')
  }

  // ── Left: quest log ──
  const questLog = (
    <div
      style={{
        width: isMobile ? '100%' : '300px',
        flexShrink: 0,
        backgroundColor: T.bgSurface,
        border: '1px solid ' + T.borderSubtle,
        borderRadius: T.rMd,
        padding: '14px',
        alignSelf: 'flex-start',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: T.accent,
          fontFamily: T.fontMono,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          textShadow: T.textGlow,
          marginBottom: '12px',
        }}
      >
        ▌ Quest Log
      </div>

      {/* filter toggle */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
        {[['active', 'Active'], ['archived', 'History']].map(([val, label]) => {
          const active = questFilter === val
          return (
            <button
              key={val}
              onClick={() => setQuestFilter(val)}
              style={{
                flex: 1,
                backgroundColor: active ? T.accentGlow : 'transparent',
                border: '1px solid ' + (active ? T.accentMuted : T.borderSubtle),
                borderRadius: '3px',
                padding: '6px 8px',
                color: active ? T.accent : T.textSecondary,
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: T.fontMono,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* add quest */}
      {questFilter === 'active' && (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          <input
            value={questDraft}
            onChange={e => setQuestDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submitQuest() }}
            placeholder="New quest…"
            style={{
              flex: 1,
              backgroundColor: T.bgInput,
              border: '1px solid ' + T.borderSubtle,
              borderRadius: '4px',
              padding: '8px 10px',
              color: T.textPrimary,
              fontSize: '13px',
              fontFamily: T.fontMono,
              outline: 'none',
            }}
          />
          <button
            onClick={submitQuest}
            style={{
              backgroundColor: T.accent,
              border: 'none',
              borderRadius: '4px',
              padding: '0 12px',
              color: '#06140b',
              fontSize: '15px',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            +
          </button>
        </div>
      )}

      {/* quest list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {visibleQuests.length === 0 && (
          <div style={{ color: T.textMuted, fontSize: '12px', fontFamily: T.fontMono, padding: '12px 4px' }}>
            {questFilter === 'archived' ? 'No completed quests yet.' : 'No active quests. Create one above.'}
          </div>
        )}
        {visibleQuests.map(q => {
          const isSel = q.id === selectedQuestId
          const total = (childrenByParent[q.id] || []).length
          return (
            <button
              key={q.id}
              onClick={() => onSelectQuest(q.id)}
              style={{
                textAlign: 'left',
                backgroundColor: isSel ? T.accentGlow : 'transparent',
                border: '1px solid ' + (isSel ? T.accent : T.borderSubtle),
                borderRadius: '4px',
                padding: '10px 12px',
                color: isSel ? T.accent : T.textPrimary,
                cursor: 'pointer',
                fontSize: '13px',
                fontFamily: T.fontMono,
                boxShadow: isSel ? 'inset 0 0 12px rgba(43,255,136,0.12), ' + T.shGlow : 'none',
                textShadow: isSel ? T.textGlow : 'none',
                transition: 'all ' + T.trF,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ flexShrink: 0, opacity: 0.7 }}>{q.archived ? '✓' : isSel ? '▸' : '·'}</span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textDecoration: q.archived ? 'line-through' : 'none',
                  opacity: q.archived ? 0.7 : 1,
                }}
              >
                {q.title}
              </span>
              <span style={{ flexShrink: 0, fontSize: '10px', color: T.textMuted }}>{total}</span>
            </button>
          )
        })}
      </div>
    </div>
  )

  // ── Right: selected quest detail ──
  const detail = (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        backgroundColor: T.bgSurface,
        border: '1px solid ' + T.borderSubtle,
        borderRadius: T.rMd,
        padding: isMobile ? '16px' : '20px',
      }}
    >
      {!selected ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted, fontSize: '13px', fontFamily: T.fontMono }}>
          ◈ Select a quest from the log to view its missions.
        </div>
      ) : (
        <>
          {/* header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '18px',
              paddingBottom: '14px',
              borderBottom: '1px solid ' + T.borderSubtle,
            }}
          >
            <h2
              style={{
                flex: 1,
                minWidth: '120px',
                margin: 0,
                fontSize: '18px',
                fontFamily: T.fontMono,
                color: selected.archived ? T.textSecondary : T.accent,
                textShadow: selected.archived ? 'none' : T.textGlow,
                letterSpacing: '0.04em',
                textDecoration: selected.archived ? 'line-through' : 'none',
              }}
            >
              {selected.title}
            </h2>

            {selected.archived ? (
              <button
                onClick={() => onReactivateQuest(selected)}
                style={questActionStyle(T.amber, T.amberGlow)}
              >
                ↺ Reactivate
              </button>
            ) : (
              <button
                onClick={() => onCompleteQuest(selected)}
                style={questActionStyle(T.accent, T.accentGlow)}
              >
                ✓ Complete Quest
              </button>
            )}

            <button
              onClick={() => onDeleteQuest(selected)}
              title="Delete quest and all its missions"
              style={{
                backgroundColor: 'transparent',
                border: '1px solid ' + T.borderSubtle,
                borderRadius: '4px',
                padding: '6px 10px',
                color: T.textMuted,
                cursor: 'pointer',
                fontSize: '11px',
                fontFamily: T.fontMono,
              }}
            >
              ✕ Delete
            </button>
          </div>

          {/* add top-level mission */}
          {!selected.archived && (
            <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
              <input
                value={missionDraft}
                onChange={e => setMissionDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submitMission() }}
                placeholder="Add mission to this quest…"
                style={{
                  flex: 1,
                  backgroundColor: T.bgInput,
                  border: '1px solid ' + T.borderSubtle,
                  borderRadius: '4px',
                  padding: '9px 12px',
                  color: T.textPrimary,
                  fontSize: '13px',
                  fontFamily: T.fontMono,
                  outline: 'none',
                }}
              />
              <button
                onClick={submitMission}
                style={{
                  backgroundColor: T.accent,
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0 16px',
                  color: '#06140b',
                  fontSize: '15px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
              >
                +
              </button>
            </div>
          )}

          {/* mission tree */}
          <MissionTree topLevel={topLevel} childrenByParent={childrenByParent} handlers={missionHandlers} />
        </>
      )}
    </div>
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '16px',
        maxWidth: '1200px',
        margin: '0 auto',
        alignItems: 'flex-start',
      }}
    >
      {questLog}
      {detail}
    </div>
  )
}

function questActionStyle(color, glow) {
  return {
    backgroundColor: glow,
    border: '1px solid ' + color,
    borderRadius: '4px',
    padding: '6px 12px',
    color,
    cursor: 'pointer',
    fontSize: '11px',
    fontFamily: T.fontMono,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  }
}
