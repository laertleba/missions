import { T } from '../lib/theme'

export default function ImportModal({ data, onApply, onCancel }) {
  const list = data.items || []
  const questCount = list.filter(i => i.type === 'quest').length
  const missionCount = list.filter(i => i.type === 'mission').length

  function Btn({ label, onClick, accent }) {
    return (
      <button
        onClick={onClick}
        style={{
          flex: 1,
          padding: '10px',
          borderRadius: T.rSm,
          border: '1px solid ' + (accent ? T.accent : T.borderSubtle),
          backgroundColor: accent ? T.accentGlow : 'transparent',
          color: accent ? T.accent : T.textPrimary,
          cursor: 'pointer',
          fontSize: '13px',
          fontFamily: T.fontMono,
          fontWeight: '500',
        }}
      >
        {label}
      </button>
    )
  }

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.78)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: T.bgSurface,
          border: '1px solid ' + T.accentMuted,
          borderRadius: T.rMd,
          padding: '24px',
          maxWidth: '400px',
          width: '100%',
          boxShadow: T.shGlow,
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', color: T.accent, fontFamily: T.fontMono, textShadow: T.textGlow, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          ▌ Import Backup
        </h3>
        <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: T.textSecondary, fontFamily: T.fontMono }}>
          Found <strong style={{ color: T.textPrimary }}>{questCount}</strong> quests and{' '}
          <strong style={{ color: T.textPrimary }}>{missionCount}</strong> missions.
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Btn label="Replace All" onClick={() => onApply('replace')} accent />
          <Btn label="Merge" onClick={() => onApply('merge')} />
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: T.rSm,
              border: '1px solid ' + T.borderSubtle,
              backgroundColor: 'transparent',
              color: T.textMuted,
              cursor: 'pointer',
              fontSize: '13px',
              fontFamily: T.fontMono,
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
