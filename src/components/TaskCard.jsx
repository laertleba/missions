import { T, eiStyle } from '../lib/theme'
import { fmtTime } from '../lib/utils'

function Chk({ size }) {
  return (
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 10 10" fill="none" style={{ display: 'block' }}>
      <path d="M2 5L4.5 7.5L8 3" stroke="#06140b" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CB({ size, done, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        minWidth: size,
        borderRadius: '4px',
        border: '2px solid ' + (done ? T.accent : T.textMuted),
        backgroundColor: done ? T.accent : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        marginTop: '1px',
        transition: T.trF,
        flexShrink: 0,
      }}
    >
      {done ? <Chk size={size} /> : null}
    </div>
  )
}

export default function TaskCard({
  task, dateString, expanded, isMobile, isDragOver, isDragging, showTime,
  onExpand, onToggle, onDelete, onUpdateText, onUpdateStart, onUpdateDur, onMove,
  onDragStart, onDragEnd, onSetDragOver, onDropOnTask,
}) {
  const done = !!task.completed
  const cb = isMobile ? 22 : 18
  const pl = cb + 8 + 'px'

  const cardStyle = {
    backgroundColor: done ? T.bgInput : T.bgSurfaceAlt,
    padding: isMobile ? '14px 16px' : '12px 14px',
    borderRadius: '8px',
    cursor: isMobile ? 'pointer' : 'grab',
    border: isDragOver ? '2px solid ' + T.accent : '1px solid ' + T.borderSubtle,
    opacity: isDragging ? 0.4 : done ? 0.7 : 1,
    boxShadow: isDragOver ? T.shHover : done ? 'none' : T.shCard,
    transition: 'all ' + T.trF,
  }

  const dragAttrs = !isMobile
    ? {
        draggable: true,
        onDragStart: () => onDragStart(dateString, task),
        onDragEnd: onDragEnd,
        onDragOver: e => { e.preventDefault(); e.stopPropagation(); onSetDragOver(task.id) },
        onDragLeave: () => onSetDragOver(null),
        onDrop: e => { e.preventDefault(); e.stopPropagation(); onDropOnTask(dateString, task.id) },
      }
    : {}

  return (
    <div
      key={task.id}
      onClick={() => onExpand(expanded ? null : task.id)}
      style={cardStyle}
      {...dragAttrs}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: expanded ? '8px' : '4px' }}>
        <CB size={cb} done={done} onClick={e => { e.stopPropagation(); onToggle(dateString, task.id) }} />

        {expanded ? (
          <input
            type="text"
            value={task.text}
            onChange={e => onUpdateText(dateString, task.id, e.target.value)}
            onClick={e => e.stopPropagation()}
            style={{
              ...eiStyle,
              flex: 1,
              fontSize: '14px',
              padding: '4px 8px',
              textDecoration: done ? 'line-through' : 'none',
              opacity: done ? 0.5 : 1,
              fontWeight: '500',
            }}
          />
        ) : (
          <span
            style={{
              fontSize: '14px',
              flex: 1,
              textDecoration: done ? 'line-through' : 'none',
              opacity: done ? 0.5 : 1,
              color: T.textPrimary,
              lineHeight: '1.5',
              fontWeight: '500',
            }}
          >
            {task.text}
          </span>
        )}

        {showTime && !expanded && (
          <span style={{ fontSize: '11px', color: T.textMuted, whiteSpace: 'nowrap', marginTop: '2px' }}>
            {fmtTime(task.startTime)}–{fmtTime(task.endTime)}
          </span>
        )}

        <button
          onClick={e => { e.stopPropagation(); onDelete(dateString, task.id) }}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: T.textMuted,
            cursor: 'pointer',
            fontSize: '14px',
            padding: '0 2px',
            lineHeight: '1',
            flexShrink: 0,
          }}
        >
          ×
        </button>
      </div>

      {/* Body */}
      {!expanded ? (
        showTime ? null : (
          <div style={{ fontSize: '11px', color: T.textMuted, opacity: done ? 0.5 : 1, paddingLeft: pl }}>
            {fmtTime(task.startTime)} – {fmtTime(task.endTime)}
          </div>
        )
      ) : (
        <div onClick={e => e.stopPropagation()}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: T.textSecondary,
              paddingLeft: pl,
              marginBottom: '6px',
              flexWrap: 'wrap',
            }}
          >
            <input
              type="time"
              value={fmtTime(task.startTime)}
              onChange={e => onUpdateStart(dateString, task.id, e.target.value)}
              style={eiStyle}
            />
            <span style={{ color: T.textMuted }}>–</span>
            <span>{fmtTime(task.endTime)}</span>
            <input
              type="number"
              value={task.duration}
              onChange={e => onUpdateDur(dateString, task.id, parseInt(e.target.value) || 30)}
              style={{ ...eiStyle, width: '48px' }}
            />
            <span>min</span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '11px',
              color: T.textSecondary,
              paddingLeft: pl,
            }}
          >
            <span>Move to:</span>
            <input
              type="date"
              value={dateString}
              onChange={e => { if (e.target.value) onMove(dateString, task.id, e.target.value) }}
              style={eiStyle}
            />
          </div>
        </div>
      )}
    </div>
  )
}
