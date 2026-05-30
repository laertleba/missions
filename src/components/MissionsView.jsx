import { useState, useEffect } from 'react'
import { T } from '../lib/theme'
import MissionTree from './MissionTree'

export default function MissionsView({
  quests, childrenByParent, isMobile,
  missionHandlers, onAddMission,
}) {
  const activeQuests = quests.filter(q => !q.archived)
  const [selectedQuestId, setSelectedQuestId] = useState(activeQuests[0]?.id || null)
  const [draft, setDraft] = useState('')

  // Keep selectedQuestId in sync if the chosen quest gets archived/deleted
  useEffect(() => {
    if (!selectedQuestId || !activeQuests.some(q => q.id === selectedQuestId)) {
      setSelectedQuestId(activeQuests[0]?.id || null)
    }
  }, [activeQuests]) // eslint-disable-line

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
        marginBottom: '24px',
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

      {/* ── Hierarchical missions grouped by quest ── */}
      {activeQuests.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: T.textMuted, fontSize: '13px', fontFamily: T.fontMono }}>
          No active quests. Head to the Quests tab to get started.
        </div>
      )}

      {activeQuests.map(quest => {
        const topLevel = childrenByParent[quest.id] || []
        return (
          <div key={quest.id} style={{ marginBottom: '28px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              marginBottom: '10px', paddingBottom: '8px',
              borderBottom: '1px solid ' + T.borderSubtle,
            }}>
              <span style={{
                fontSize: isMobile ? '12px' : '13px', fontFamily: T.fontMono,
                color: T.accent, textShadow: T.textGlow,
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>▸ {quest.title}</span>
              <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontMono }}>
                ({topLevel.length})
              </span>
            </div>
            <MissionTree
              topLevel={topLevel}
              childrenByParent={childrenByParent}
              handlers={missionHandlers}
              isMobile={isMobile}
              emptyMessage="No missions yet. Add one above."
            />
          </div>
        )
      })}
    </div>
  )
}
