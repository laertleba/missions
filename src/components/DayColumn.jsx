import { T } from '../lib/theme'
import TaskCard from './TaskCard'

export default function DayColumn({
  dateString, date, isToday, isWeekend, dayTasks, inputValue,
  expandedTask, dragOverTaskId, draggedItem, isMobile,
  quests, selectedQuestId, onSelectQuest,
  onInput, onAdd, onExpand, onToggle, onDelete,
  onUpdateText, onUpdateStart, onUpdateDur, onMove,
  onDragStart, onDragEnd, onSetDragOver, onDropOnDay, onDropOnTask,
}) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' })
  const dateDisp = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const tasks = dayTasks || []
  const hasQuests = quests && quests.length > 0

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
        border: isToday ? '1px solid ' + T.accent : '1px solid ' + T.borderSubtle,
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
            fontSize: isMobile ? '20px' : '17px',
            fontWeight: '700',
            margin: '0 0 4px 0',
            color: isToday ? T.accent : T.textPrimary,
            textShadow: isToday ? T.textGlow : 'none',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            fontFamily: T.fontMono,
          }}
        >
          {dayName}
        </h2>
        <div style={{ fontSize: '12px', color: T.textMuted, marginBottom: '16px', fontWeight: '500', fontFamily: T.fontMono, letterSpacing: '0.05em' }}>
          {dateDisp}
        </div>

        <div style={{ display: 'flex', gap: '6px', marginBottom: hasQuests ? '8px' : '6px' }}>
          <input
            type="text"
            value={inputValue || ''}
            onChange={e => onInput(dateString, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') onAdd(dateString) }}
            placeholder={hasQuests ? 'Add mission…' : 'Create a quest first'}
            disabled={!hasQuests}
            style={{
              flex: 1,
              backgroundColor: T.bgInput,
              border: '1px solid ' + T.borderSubtle,
              borderRadius: T.rSm,
              padding: isMobile ? '10px 12px' : '9px 12px',
              color: T.textPrimary,
              fontSize: '14px',
              outline: 'none',
              fontFamily: T.fontMono,
              opacity: hasQuests ? 1 : 0.5,
              cursor: hasQuests ? 'text' : 'not-allowed',
              transition: T.trF,
            }}
          />
          <button
            onClick={() => onAdd(dateString)}
            disabled={!hasQuests}
            style={{
              backgroundColor: hasQuests ? T.accent : T.borderSubtle,
              border: 'none',
              borderRadius: T.rSm,
              padding: isMobile ? '10px 14px' : '9px 16px',
              color: hasQuests ? '#06140b' : T.textMuted,
              cursor: hasQuests ? 'pointer' : 'not-allowed',
              fontSize: '16px',
              fontWeight: '700',
            }}
          >
            +
          </button>
        </div>

        {hasQuests && (
          <select
            value={selectedQuestId || ''}
            onChange={e => onSelectQuest(e.target.value)}
            title="Quest this mission belongs to"
            style={{
              width: '100%',
              backgroundColor: T.bgInput,
              border: '1px solid ' + T.borderSubtle,
              borderRadius: T.rSm,
              padding: '6px 8px',
              color: T.textSecondary,
              fontSize: '11px',
              outline: 'none',
              fontFamily: T.fontMono,
              cursor: 'pointer',
            }}
          >
            {quests.map(q => (
              <option key={q.id} value={q.id} style={{ backgroundColor: T.bgSurface, color: T.textPrimary }}>
                ▸ {q.title}
              </option>
            ))}
          </select>
        )}
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
