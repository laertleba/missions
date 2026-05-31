import { T } from '../lib/theme'
import MissionTree from './MissionTree'

export default function DayColumn({
  dateString, date, isToday, isWeekend, dayTasks, isMobile,
  childrenByParent, questsById, missionHandlers,
}) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateDisp = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const tasks = dayTasks || []

  // Root missions for this day: missions whose parent is not also in this day's list.
  // Top-level missions (parent = quest) are always roots; sub-missions only become
  // roots if their parent isn't scheduled for the same day.
  const dayTaskIds = new Set(tasks.map(t => t.id))
  const rootMissions = tasks.filter(t => !dayTaskIds.has(t.parentId))

  const questLabels = new Map(rootMissions.map(m => [m.id, questsById?.[m.questId]?.title || '']))

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
      <h2 style={{
        fontSize: isMobile ? '16px' : '15px',
        fontWeight: '700', margin: '0 0 2px 0',
        color: isToday ? T.accent : T.textPrimary,
        textShadow: isToday ? T.textGlow : 'none',
        letterSpacing: '0.04em', textTransform: 'uppercase',
        fontFamily: T.fontMono,
      }}>
        {dayName}
      </h2>
      <div style={{ fontSize: isMobile ? '10px' : '11px', color: T.textMuted, marginBottom: '12px', fontFamily: T.fontMono, letterSpacing: '0.05em' }}>
        {dateDisp}
      </div>

      <MissionTree
        topLevel={rootMissions}
        childrenByParent={childrenByParent}
        handlers={missionHandlers}
        isMobile={isMobile}
        questLabels={questLabels}
        emptyMessage="No missions"
      />
    </div>
  )
}
