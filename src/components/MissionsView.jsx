import { useState, useEffect, useMemo } from 'react'
import { T } from '../lib/theme'
import MissionTree from './MissionTree'

export default function MissionsView({
  quests, childrenByParent, isMobile,
  missionHandlers, onAddMission,
}) {
  const activeQuests = useMemo(() => quests.filter(q => !q.archived), [quests])
  const questsById = useMemo(() => Object.fromEntries(quests.map(q => [q.id, q])), [quests])

  const [selectedQuestId, setSelectedQuestId] = useState(activeQuests[0]?.id || null)
  const [draft, setDraft] = useState('')

  // Keep selectedQuestId in sync if the chosen quest gets archived/deleted
  useEffect(() => {
    if (!selectedQuestId || !activeQuests.some(q => q.id === selectedQuestId)) {
      setSelectedQuestId(activeQuests[0]?.id || null)
    }
  }, [activeQuests]) // eslint-disable-line

  // All top-level missions across active quests, sorted: starred first → scheduled date asc (nulls last) → createdAt asc
  // Completed root missions are hidden; completed children remain visible under active parents.
  const allTopLevel = useMemo(() => {
    const missions = activeQuests.flatMap(q => childrenByParent[q.id] || []).filter(m => !m.completed)
    return [...missions].sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1
      if (a.scheduledDate && b.scheduledDate) return a.scheduledDate < b.scheduledDate ? -1 : 1
      if (a.scheduledDate) return -1
      if (b.scheduledDate) return 1
      return (a.createdAt || '') < (b.createdAt || '') ? -1 : 1
    })
  }, [activeQuests, childrenByParent])

  // Map mission id → quest title, for badges on each root item
  const questLabels = useMemo(() => {
    const m = new Map()
    for (const mission of allTopLevel) {
      const quest = questsById[mission.questId]
      if (quest) m.set(mission.id, quest.title)
    }
    return m
  }, [allTopLevel, questsById])

  function submit() {
    const t = draft.trim()
    if (!t || !selectedQuestId) return
    onAddMission(selectedQuestId, t)
    setDraft('')
  }

  const labelStyle = {
    display: 'block', fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono,
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px',
  }
  const inpStyle = {
    backgroundColor: T.bgInput, border: '1px solid ' + T.borderSubtle,
    borderRadius: '4px', padding: isMobile ? '9px 12px' : '8px 12px',
    color: T.textPrimary, fontSize: isMobile ? '14px' : '13px',
    fontFamily: T.fontMono, outline: 'none', flex: 1,
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Add mission ── */}
      <div style={{
        backgroundColor: T.bgSurface,
        border: '1px solid ' + T.borderSubtle,
        borderRadius: T.rMd,
        padding: isMobile ? '14px' : '16px',
        marginBottom: '20px',
      }}>
        <div style={{ fontSize: '11px', color: T.accent, fontFamily: T.fontMono, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px', textShadow: T.textGlow }}>
          ▌ New Mission
        </div>

        {activeQuests.length === 0 ? (
          <div style={{ fontSize: '12px', color: T.textMuted, fontFamily: T.fontMono }}>
            Create a quest first — missions must belong to a quest.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '8px' }}>
            <div style={{ flexShrink: 0, minWidth: isMobile ? '100%' : '180px', maxWidth: isMobile ? '100%' : '220px' }}>
              <label style={labelStyle}>Quest</label>
              <select
                value={selectedQuestId || ''}
                onChange={e => setSelectedQuestId(e.target.value)}
                style={{
                  width: '100%', backgroundColor: T.bgInput,
                  border: '1px solid ' + T.borderSubtle, borderRadius: '4px',
                  padding: isMobile ? '9px 12px' : '8px 12px',
                  color: T.textPrimary, fontSize: isMobile ? '14px' : '13px',
                  fontFamily: T.fontMono, outline: 'none', cursor: 'pointer',
                }}
              >
                {activeQuests.map(q => (
                  <option key={q.id} value={q.id} style={{ backgroundColor: T.bgSurface }}>{q.title}</option>
                ))}
              </select>
            </div>

            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Mission title</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') submit() }}
                  placeholder="New mission…"
                  style={inpStyle}
                />
                <button
                  onClick={submit}
                  disabled={!draft.trim() || !selectedQuestId}
                  style={{
                    backgroundColor: T.accent, border: 'none', borderRadius: '4px',
                    padding: isMobile ? '0 16px' : '0 14px',
                    color: '#06140b', fontSize: '16px', fontWeight: '700',
                    cursor: 'pointer', flexShrink: 0,
                    opacity: !draft.trim() || !selectedQuestId ? 0.4 : 1,
                  }}
                >+</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Flat mission list ── */}
      {activeQuests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textMuted, fontSize: '13px', fontFamily: T.fontMono }}>
          No active quests. Head to the Quests tab to get started.
        </div>
      ) : (
        <MissionTree
          topLevel={allTopLevel}
          childrenByParent={childrenByParent}
          handlers={missionHandlers}
          isMobile={isMobile}
          questLabels={questLabels}
          emptyMessage="No missions yet. Add one above."
        />
      )}
    </div>
  )
}
