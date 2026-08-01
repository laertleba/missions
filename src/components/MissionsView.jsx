import { useState, useMemo } from 'react'
import { T } from '../lib/theme'
import MissionTree from './MissionTree'
import MissionCreateModal from './MissionCreateModal'

export default function MissionsView({
  quests, childrenByParent, isMobile,
  missionHandlers, onAddMission,
}) {
  const activeQuests = useMemo(() => quests.filter(q => !q.archived), [quests])
  const questsById = useMemo(() => Object.fromEntries(quests.map(q => [q.id, q])), [quests])

  const [showCreate, setShowCreate] = useState(false)

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

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* ── Add mission ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        {activeQuests.length === 0 ? (
          <div style={{ fontSize: '12px', color: T.textMuted, fontFamily: T.fontMono }}>
            Create a quest first — missions must belong to a quest.
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              backgroundColor: T.accentGlow, border: '1px solid ' + T.accentMuted, borderRadius: '4px',
              padding: isMobile ? '9px 14px' : '8px 14px', color: T.accent, cursor: 'pointer',
              fontSize: isMobile ? '13px' : '12px', fontFamily: T.fontMono, fontWeight: '600',
              textShadow: T.textGlow, letterSpacing: '0.04em',
            }}
          >+ Add Mission</button>
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

      {showCreate && (
        <MissionCreateModal
          dateString={null}
          quests={activeQuests}
          onAdd={onAddMission}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
