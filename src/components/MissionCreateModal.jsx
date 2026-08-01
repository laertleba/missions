import { useState } from 'react'
import { T } from '../lib/theme'

export default function MissionCreateModal({ dateString, quests, onAdd, onClose }) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState('')
  const [questId, setQuestId] = useState(quests[0]?.id || '')
  const [date, setDate] = useState(dateString || '')
  const [notes, setNotes] = useState('')

  function handleSave() {
    const t = title.trim()
    if (!t || !questId) return
    onAdd(questId, t, date || null, notes)
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
          maxWidth: '420px',
          width: '100%',
          boxShadow: T.shGlow,
        }}
      >
        <h3 style={{ margin: '0 0 18px 0', fontSize: '13px', color: T.accent, fontFamily: T.fontMono, letterSpacing: '0.1em', textTransform: 'uppercase', textShadow: T.textGlow }}>
          ▌ New Mission
        </h3>

        <label style={lbl}>Title</label>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Escape') onClose() }}
          placeholder="Mission name…"
          style={{ ...inp, marginBottom: '14px' }}
        />

        {quests.length > 0 && (
          <>
            <label style={lbl}>Quest</label>
            <select
              value={questId}
              onChange={e => setQuestId(e.target.value)}
              style={{ ...inp, marginBottom: '14px', cursor: 'pointer' }}
            >
              {quests.map(q => (
                <option key={q.id} value={q.id} style={{ backgroundColor: T.bgSurface }}>{q.title}</option>
              ))}
            </select>
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <label style={{ ...lbl, marginBottom: 0 }}>Date</label>
          <button
            type="button"
            onClick={() => setDate(d => d === todayStr ? '' : todayStr)}
            title="Toggle today"
            style={{ backgroundColor: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', lineHeight: 1, padding: 0, color: date === todayStr ? T.accent : T.textMuted, textShadow: date === todayStr ? T.textGlow : 'none' }}
          >⊕</button>
        </div>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ ...inp, marginBottom: '14px' }}
        />

        <label style={lbl}>Notes</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Optional notes…"
          rows={3}
          style={{ ...inp, marginBottom: '20px', resize: 'vertical', lineHeight: '1.5' }}
        />

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid ' + T.borderSubtle, backgroundColor: 'transparent', color: T.textMuted, cursor: 'pointer', fontSize: '12px', fontFamily: T.fontMono }}
          >Cancel</button>
          <button
            onClick={handleSave}
            style={{ flex: 2, padding: '10px', borderRadius: '4px', border: '1px solid ' + T.accent, backgroundColor: T.accentGlow, color: T.accent, cursor: 'pointer', fontSize: '12px', fontFamily: T.fontMono, fontWeight: '600', textShadow: T.textGlow }}
          >Add Mission</button>
        </div>
      </div>
    </div>
  )
}
