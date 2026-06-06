import { T } from '../lib/theme'
import DayMissionTree from './DayMissionTree'

export default function DayColumn({
  dateString, date, isToday, isWeekend, dayTasks, isMobile,
  childrenByParent, questsById, missionsById, missionHandlers, onAddForDate,
}) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateDisp = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const tasks = dayTasks || []

  const dayTaskIds = new Set(tasks.map(t => t.id))
  const rootMissions = tasks.filter(t => !dayTaskIds.has(t.parentId))

  // Quest label for each root mission
  const questLabels = new Map(rootMissions.map(m => [m.id, questsById?.[m.questId]?.title || '']))

  // Parent mission label: only for sub-missions (parentId !== questId)
  const parentLabels = new Map(
    rootMissions
      .filter(m => m.parentId !== m.questId)
      .map(m => [m.id, missionsById?.[m.parentId]?.title || ''])
  )

  return (
    <div
      style={{
        backgroundColor: isToday ? T.bgToday : isWeekend ? T.bgWeekend : T.bgSurface,
        borderRadius: T.rMd,
        padding: isMobile ? '14px' : '14px 12px',
        minHeight: isMobile ? 'auto' : '320px',
        border: isToday ? '1px solid ' + T.accent : '1px solid ' + T.borderSubtle,
        boxShadow: isToday ? T.shGlow : T.shCard,
        transition: T.trM,
        overflow: 'hidden',
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
        <h2 style={{
          fontSize: isMobile ? '16px' : '15px',
          fontWeight: '700', margin: 0,
          color: isToday ? T.accent : T.textPrimary,
          textShadow: isToday ? T.textGlow : 'none',
          letterSpacing: '0.04em', textTransform: 'uppercase',
          fontFamily: T.fontMono,
        }}>
          {dayName}
        </h2>
        {onAddForDate && (
          <button
            onClick={() => onAddForDate(dateString)}
            title="Add mission to this day"
            style={{
              backgroundColor: 'transparent',
              border: '1px solid ' + T.borderSubtle,
              borderRadius: '4px',
              color: T.textMuted,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              lineHeight: 1,
              padding: '2px 7px',
              fontFamily: T.fontMono,
              transition: 'color ' + T.trF,
            }}
          >+</button>
        )}
      </div>
      <div style={{ fontSize: isMobile ? '10px' : '11px', color: T.textMuted, marginBottom: '12px', fontFamily: T.fontMono, letterSpacing: '0.05em' }}>
        {dateDisp}
      </div>

      <DayMissionTree
        topLevel={rootMissions}
        childrenByParent={childrenByParent}
        handlers={missionHandlers}
        isMobile={isMobile}
        questLabels={questLabels}
        parentLabels={parentLabels}
        deprioritizeCompleted
        emptyMessage="No missions"
      />
    </div>
  )
}
