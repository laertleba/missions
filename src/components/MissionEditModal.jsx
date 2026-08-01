import { useState } from 'react'
import { T } from '../lib/theme'
import { fmtTime } from '../lib/utils'

function timeStrToMinutes(str) {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

export default function MissionEditModal({ mission, onSave, onClose, quests = [] }) {
  const [title, setTitle] = useState(mission.title)
  const [date, setDate] = useState(mission.scheduledDate || '')
  const [startStr, setStartStr] = useState(mission.startTime != null ? fmtTime(mission.startTime) : '')
  const [duration, setDuration] = useState(mission.duration || 30)
  const [notes, setNotes] = useState(mission.notes || '')
  const [questId, setQuestId] = useState(mission.questId || '')
  const [expanded, setExpanded] = useState(false)
  const todayStr = new Date().toISOString().slice(0, 10)

  // Only top-level missions (parentId === questId) can be moved to another quest
  const isTopLevel = mission.parentId === mission.questId
  const activeQuests = quests.filter(q => !q.archived)

  function handleSave() {
    const startTime = timeStrToMinutes(startStr)
    onSave(mission.id, {
      title: title.trim() || mission.title,
      scheduledDate: date || null,
      startTime,
      duration: Number(duration) || 30,
      notes,
      questId: questId !== mission.questId ? questId : undefined,
    })
    onClose()
  }

  const inp = {
    backgroundColor: T.bgInput,
    border: '1px solid ' + T.borderSubtle,
    borderRadius: '4px',
    padding: '9px 12px',
    color: T.textPrimary,
    fontSize: '13px',
    fontFamily: T.fontMono,
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  }
  const lbl = {
    display: 'block', fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono,
    marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase',
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '20px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onKeyDown={e => {
          if (e.key === 'Enter' && !['TEXTAREA', 'BUTTON', 'SELECT'].includes(e.target.tagName)) { e.preventDefault(); handleSave() }
        }}
        style={{
          backgroundColor: T.bgSurface,
          border: '1px solid ' + T.accentMuted,
          borderRadius: T.rMd,
          padding: '24px',
          ...(expanded
            ? { width: '96vw', maxWidth: '96vw', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column' }
            : { maxWidth: '460px', width: '100%' }),
          boxShadow: T.shGlow,
          transition: 'width 0.18s, height 0.18s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h3 style={{ margin: 0, fontSize: '13px', color: T.accent, fontFamily: T.fontMono, letterSpacing: '0.1em', textTransform: 'uppercase', textShadow: T.textGlow }}>
            ▌ Edit Mission
          </h3>
          <button
            onClick={() => setExpanded(x => !x)}
            title={expanded ? 'Restore' : 'Expand'}
            style={{ backgroundColor: 'transparent', border: '1px solid ' + T.borderSubtle, borderRadius: '4px', color: T.textMuted, cursor: 'pointer', fontSize: '13px', lineHeight: 1, padding: '3px 7px' }}
          >{expanded ? '⊡' : '⛶'}</button>
        </div>

        {/* scrollable fields area — grows when expanded */}
        <div style={expanded ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' } : {}}>
          <label style={lbl}>Title</label>
          <input
            autoFocus
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Escape') onClose() }}
            style={{ ...inp, marginBottom: '14px' }}
          />

          {expanded ? (
            /* ── expanded: all secondary fields on one row ── */
            <div style={{ display: 'flex', gap: '12px', marginBottom: '14px', flexWrap: 'wrap' }}>
              {isTopLevel && activeQuests.length > 1 && (
                <div style={{ flex: '2 1 160px', minWidth: 0 }}>
                  <label style={lbl}>Quest</label>
                  <select value={questId} onChange={e => setQuestId(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
                    {activeQuests.map(q => (
                      <option key={q.id} value={q.id} style={{ backgroundColor: T.bgSurface }}>{q.title}</option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ flex: '1 1 120px', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <label style={{ ...lbl, marginBottom: 0 }}>Date</label>
                  <button type="button" onClick={() => setDate(d => d === todayStr ? '' : todayStr)} title="Toggle today" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0, color: date === todayStr ? T.accent : T.textMuted, textShadow: date === todayStr ? T.textGlow : 'none' }}>⊕</button>
                </div>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
              </div>
              <div style={{ flex: '1 1 100px', minWidth: 0 }}>
                <label style={lbl}>Start time</label>
                <input type="time" value={startStr} onChange={e => setStartStr(e.target.value)} style={inp} />
              </div>
              <div style={{ flex: '1 1 80px', minWidth: 0 }}>
                <label style={lbl}>Duration (min)</label>
                <input type="number" min="5" step="5" value={duration} onChange={e => setDuration(e.target.value)} style={inp} />
              </div>
            </div>
          ) : (
            /* ── compact: stacked layout ── */
            <>
              {isTopLevel && activeQuests.length > 1 && (
                <>
                  <label style={lbl}>Quest</label>
                  <select value={questId} onChange={e => setQuestId(e.target.value)} style={{ ...inp, marginBottom: '14px', cursor: 'pointer' }}>
                    {activeQuests.map(q => (
                      <option key={q.id} value={q.id} style={{ backgroundColor: T.bgSurface }}>{q.title}</option>
                    ))}
                  </select>
                </>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <label style={{ ...lbl, marginBottom: 0 }}>Date</label>
                <button type="button" onClick={() => setDate(d => d === todayStr ? '' : todayStr)} title="Toggle today" style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0, color: date === todayStr ? T.accent : T.textMuted, textShadow: date === todayStr ? T.textGlow : 'none' }}>⊕</button>
              </div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inp, marginBottom: '14px' }} />
              <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Start time</label>
                  <input type="time" value={startStr} onChange={e => setStartStr(e.target.value)} style={inp} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={lbl}>Duration (min)</label>
                  <input type="number" min="5" step="5" value={duration} onChange={e => setDuration(e.target.value)} style={inp} />
                </div>
              </div>
            </>
          )}

          <label style={lbl}>Notes</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes…"
            rows={expanded ? undefined : 3}
            style={{
              ...inp,
              marginBottom: '20px',
              resize: expanded ? 'none' : 'vertical',
              lineHeight: '1.6',
              ...(expanded ? { flex: 1, minHeight: 0 } : {}),
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: '4px',
              border: '1px solid ' + T.borderSubtle,
              backgroundColor: 'transparent', color: T.textMuted,
              cursor: 'pointer', fontSize: '12px', fontFamily: T.fontMono,
            }}
          >Cancel</button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: '10px', borderRadius: '4px',
              border: '1px solid ' + T.accent,
              backgroundColor: T.accentGlow, color: T.accent,
              cursor: 'pointer', fontSize: '12px', fontFamily: T.fontMono,
              fontWeight: '600', textShadow: T.textGlow,
            }}
          >Save</button>
        </div>
      </div>
    </div>
  )
}
