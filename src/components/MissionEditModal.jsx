import { useState } from 'react'
import { T } from '../lib/theme'
import { fmtTime } from '../lib/utils'

function timeStrToMinutes(str) {
  if (!str) return null
  const [h, m] = str.split(':').map(Number)
  if (isNaN(h) || isNaN(m)) return null
  return h * 60 + m
}

export default function MissionEditModal({ mission, onSave, onClose }) {
  const [title, setTitle] = useState(mission.title)
  const [date, setDate] = useState(mission.scheduledDate || '')
  const [startStr, setStartStr] = useState(mission.startTime != null ? fmtTime(mission.startTime) : '')
  const [duration, setDuration] = useState(mission.duration || 30)

  function handleSave() {
    const startTime = timeStrToMinutes(startStr)
    onSave(mission.id, {
      title: title.trim() || mission.title,
      scheduledDate: date || null,
      startTime,
      duration: Number(duration) || 30,
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

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        backgroundColor: 'rgba(0,0,0,0.78)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
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
          ▌ Edit Mission
        </h3>

        <label style={{ display: 'block', fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono, marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Title</label>
        <input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose() }}
          style={{ ...inp, marginBottom: '14px' }}
        />

        <label style={{ display: 'block', fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono, marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Date</label>
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          style={{ ...inp, marginBottom: '14px' }}
        />

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono, marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Start time</label>
            <input
              type="time"
              value={startStr}
              onChange={e => setStartStr(e.target.value)}
              style={inp}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono, marginBottom: '4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Duration (min)</label>
            <input
              type="number"
              min="5"
              step="5"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              style={inp}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '10px', borderRadius: '4px',
              border: '1px solid ' + T.borderSubtle,
              backgroundColor: 'transparent', color: T.textMuted,
              cursor: 'pointer', fontSize: '12px', fontFamily: T.fontMono,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: '10px', borderRadius: '4px',
              border: '1px solid ' + T.accent,
              backgroundColor: T.accentGlow, color: T.accent,
              cursor: 'pointer', fontSize: '12px', fontFamily: T.fontMono,
              fontWeight: '600', textShadow: T.textGlow,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
