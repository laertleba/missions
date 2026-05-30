import { T } from '../lib/theme'
import TaskCard from './TaskCard'

export default function DayColumn({
  dateString, date, isToday, isWeekend, dayTasks,
  expandedTask, dragOverTaskId, draggedItem, isMobile,
  onExpand, onToggle, onDelete,
  onUpdateText, onUpdateStart, onUpdateDur, onMove,
  onDragStart, onDragEnd, onSetDragOver, onDropOnDay, onDropOnTask,
}) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateDisp = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const tasks = dayTasks || []

  const sharedTaskProps = {
    isMobile, expandedTask, showTime: false,
    onExpand, onToggle, onDelete,
    onUpdateText, onUpdateStart, onUpdateDur, onMove,
    onDragStart, onDragEnd, onSetDragOver, onDropOnTask,
  }

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
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDropOnDay(dateString) }}
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '6px' : '8px' }}>
        {tasks.length === 0 && (
          <div style={{ fontSize: isMobile ? '10px' : '11px', color: T.textMuted, fontFamily: T.fontMono, padding: '8px 0', opacity: 0.6 }}>
            No missions
          </div>
        )}
        {tasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            dateString={dateString}
            expanded={expandedTask === task.id}
            isDragOver={dragOverTaskId === task.id}
            isDragging={draggedItem && draggedItem.task.id === task.id}
            {...sharedTaskProps}
          />
        ))}
      </div>
    </div>
  )
}
