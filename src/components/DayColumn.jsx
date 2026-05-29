import { T } from '../lib/theme'
import TaskCard from './TaskCard'

export default function DayColumn({
  dateString, date, isToday, isWeekend, dayTasks, inputValue,
  expandedTask, dragOverTaskId, draggedItem, isMobile,
  onInput, onAdd, onExpand, onToggle, onDelete,
  onUpdateText, onUpdateStart, onUpdateDur, onMove,
  onDragStart, onDragEnd, onSetDragOver, onDropOnDay, onDropOnTask,
}) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateDisp = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const tasks = dayTasks || []

  const sharedTaskProps = {
    isMobile,
    expandedTask,
    showTime: false,
    onExpand,
    onToggle,
    onDelete,
    onUpdateText,
    onUpdateStart,
    onUpdateDur,
    onMove,
    onDragStart,
    onDragEnd,
    onSetDragOver,
    onDropOnTask,
  }

  return (
    <div
      style={{
        backgroundColor: isToday ? T.bgToday : isWeekend ? T.bgWeekend : T.bgSurface,
        borderRadius: T.rMd,
        padding: isMobile ? '16px' : '16px 14px',
        minHeight: isMobile ? 'auto' : '480px',
        border: isToday ? '2px solid ' + T.accent : '1px solid ' + T.borderSubtle,
        boxShadow: isToday ? T.shGlow : T.shCard,
        transition: T.trM,
        overflow: 'hidden',
        minWidth: 0,
        flex: isMobile ? '1' : undefined,
      }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); onDropOnDay(dateString) }}
    >
      <div style={{ marginBottom: '16px' }}>
        <h2
          style={{
            fontSize: isMobile ? '20px' : '18px',
            fontWeight: '700',
            margin: '0 0 4px 0',
            color: isToday ? T.accent : T.textPrimary,
            letterSpacing: '-0.02em',
          }}
        >
          {dayName}
        </h2>
        <div style={{ fontSize: '13px', color: T.textMuted, marginBottom: '16px', fontWeight: '500' }}>
          {dateDisp}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
          <input
            type="text"
            value={inputValue || ''}
            onChange={e => onInput(dateString, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onAdd(dateString) }}
            placeholder="Add task…"
            style={{
              flex: 1,
              backgroundColor: T.bgInput,
              border: '1px solid ' + T.borderSubtle,
              borderRadius: T.rSm,
              padding: isMobile ? '10px 12px' : '9px 12px',
              color: T.textPrimary,
              fontSize: '14px',
              outline: 'none',
              transition: T.trF,
            }}
          />
          <button
            onClick={() => onAdd(dateString)}
            style={{
              backgroundColor: T.accent,
              border: 'none',
              borderRadius: T.rSm,
              padding: isMobile ? '10px 14px' : '9px 16px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
            }}
          >
            +
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
