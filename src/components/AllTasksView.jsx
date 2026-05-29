import { useState } from 'react'
import { T } from '../lib/theme'
import { getDateStr } from '../lib/utils'
import TaskCard from './TaskCard'

export default function AllTasksView({
  tasks, expandedTask, isMobile, filter, setFilter,
  onExpand, onToggle, onDelete, onUpdateText, onUpdateStart, onUpdateDur, onMove,
}) {
  const [showDays, setShowDays] = useState(30)

  const all = []
  let tot = 0, act = 0, comp = 0
  Object.keys(tasks).forEach(ds => {
    ;(tasks[ds] || []).forEach(t => {
      tot++
      if (t.completed) comp++; else act++
      if (filter === 'active' && t.completed) return
      if (filter === 'completed' && !t.completed) return
      all.push({ ...t, dateString: ds })
    })
  })
  all.sort((a, b) =>
    a.dateString !== b.dateString
      ? b.dateString.localeCompare(a.dateString)
      : a.startTime - b.startTime
  )

  const allDates = new Set(all.map(e => e.dateString))
  const groups = []
  let curD = null, curG = null, dSeen = 0
  for (let i = 0; i < all.length; i++) {
    if (all[i].dateString !== curD) {
      dSeen++
      if (dSeen > showDays) break
      curD = all[i].dateString
      curG = { ds: curD, tasks: [] }
      groups.push(curG)
    }
    curG.tasks.push(all[i])
  }
  const hasMore = dSeen < allDates.size

  const todayStr = getDateStr(new Date())
  const cb = isMobile ? 22 : 16

  function FilterBtn({ label, val }) {
    const active = filter === val
    return (
      <button
        onClick={() => setFilter(val)}
        style={{
          backgroundColor: active ? T.accentGlow : 'transparent',
          border: '1px solid ' + (active ? T.accentMuted : T.borderSubtle),
          borderRadius: '20px',
          padding: isMobile ? '8px 16px' : '6px 14px',
          color: active ? T.accent : T.textSecondary,
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: '500',
        }}
      >
        {label}
      </button>
    )
  }

  const noTaskProps = {
    isMobile,
    showTime: true,
    isDragOver: false,
    isDragging: false,
    onExpand,
    onToggle,
    onDelete,
    onUpdateText,
    onUpdateStart,
    onUpdateDur,
    onMove,
    onDragStart: () => {},
    onDragEnd: () => {},
    onSetDragOver: () => {},
    onDropOnTask: () => {},
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <FilterBtn label={`All (${tot})`} val="all" />
        <FilterBtn label={`Active (${act})`} val="active" />
        <FilterBtn label={`Completed (${comp})`} val="completed" />
      </div>

      {groups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: T.textMuted, fontSize: '14px' }}>
          {filter === 'active'
            ? 'No active tasks.'
            : filter === 'completed'
            ? 'No completed tasks yet.'
            : 'No tasks yet. Add some from the Weekly view.'}
        </div>
      )}

      {groups.map(g => {
        const gd = new Date(g.ds + 'T00:00:00')
        const isGT = g.ds === todayStr
        const dd = gd.toLocaleDateString('en-US', {
          weekday: isMobile ? 'short' : 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
        return (
          <div key={g.ds} style={{ marginBottom: '16px' }}>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                backgroundColor: T.bgDeep,
                padding: '8px 0',
                marginBottom: '6px',
                borderBottom: '1px solid ' + T.borderSubtle,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: '600', color: isGT ? T.accent : T.textPrimary }}>
                {dd}
              </span>
              <span style={{ fontSize: '11px', color: T.textMuted }}>
                ({g.tasks.length} task{g.tasks.length !== 1 ? 's' : ''})
              </span>
              {isGT && (
                <span
                  style={{
                    fontSize: '9px',
                    color: T.accent,
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Today
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {g.tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  dateString={task.dateString}
                  expanded={expandedTask === task.id}
                  {...noTaskProps}
                />
              ))}
            </div>
          </div>
        )
      })}

      {hasMore && (
        <div style={{ textAlign: 'center', padding: '16px' }}>
          <button
            onClick={() => setShowDays(showDays + 30)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid ' + T.borderSubtle,
              borderRadius: '20px',
              padding: '8px 20px',
              color: T.textSecondary,
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Show older tasks
          </button>
        </div>
      )}
    </div>
  )
}
