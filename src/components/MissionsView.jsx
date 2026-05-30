import { T } from '../lib/theme'
import { fmtTime } from '../lib/utils'

function Chk({ done, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: 20,
        height: 20,
        minWidth: 20,
        borderRadius: '4px',
        border: '2px solid ' + (done ? T.accent : T.textMuted),
        backgroundColor: done ? T.accent : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: T.trF,
        flexShrink: 0,
      }}
    >
      {done && (
        <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
          <path d="M2 5L4.5 7.5L8 3" stroke="#06140b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  )
}

export default function MissionsView({
  missions, questTitleById, isMobile, onToggle, onDelete, onJumpToQuest,
}) {
  function fmtDateTime(m) {
    const parts = []
    if (m.scheduledDate) {
      const d = new Date(m.scheduledDate + 'T00:00:00')
      parts.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
    }
    if (m.startTime != null) parts.push(fmtTime(m.startTime) + '–' + fmtTime(m.endTime))
    return parts.join(' · ')
  }

  return (
    <div style={{ maxWidth: '760px', margin: '0 auto' }}>
      <div
        style={{
          fontSize: '11px',
          color: T.textMuted,
          fontFamily: T.fontMono,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: '14px',
          paddingBottom: '8px',
          borderBottom: '1px solid ' + T.borderSubtle,
        }}
      >
        ▌ Active Missions ({missions.length})
      </div>

      {missions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted, fontSize: '14px', fontFamily: T.fontMono }}>
          No active missions. All clear, operative.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {missions.map(m => {
          const meta = fmtDateTime(m)
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                backgroundColor: T.bgSurfaceAlt,
                border: '1px solid ' + T.borderSubtle,
                borderRadius: '6px',
                padding: isMobile ? '12px 14px' : '10px 14px',
                transition: 'all ' + T.trF,
              }}
            >
              <Chk done={false} onClick={() => onToggle(m)} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '14px',
                    color: T.textPrimary,
                    fontWeight: '500',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {m.title}
                </div>
                {meta && (
                  <div style={{ fontSize: '11px', color: T.textMuted, fontFamily: T.fontMono, marginTop: '2px' }}>
                    {meta}
                  </div>
                )}
              </div>

              <button
                onClick={() => onJumpToQuest(m.questId)}
                title="Go to quest"
                style={{
                  flexShrink: 0,
                  backgroundColor: T.accentDim,
                  border: '1px solid ' + T.accentMuted,
                  borderRadius: '12px',
                  padding: '3px 10px',
                  color: T.accent,
                  fontSize: '10px',
                  fontFamily: T.fontMono,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  maxWidth: isMobile ? '110px' : '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                ◈ {questTitleById[m.questId] || 'Quest'}
              </button>

              <button
                onClick={() => onDelete(m)}
                style={{
                  flexShrink: 0,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: T.textMuted,
                  cursor: 'pointer',
                  fontSize: '15px',
                  lineHeight: '1',
                  padding: '0 2px',
                }}
              >
                ×
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
