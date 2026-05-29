import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from './lib/supabase'
import { T } from './lib/theme'
import { getDateStr, taskToRow, rowsToMap } from './lib/utils'
import Auth from './components/Auth'
import DayColumn from './components/DayColumn'
import AllTasksView from './components/AllTasksView'
import ImportModal from './components/ImportModal'

const CACHE_KEY = 'missions_cache'

export default function App() {
  // ── Auth ──
  const [session, setSession] = useState(undefined) // undefined = still loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null // brief flash before session resolves
  if (!session) return <Auth />

  return <Planner session={session} />
}

// ─────────────────────────────────────────────────────────────
// Main planner — rendered only when authenticated
// ─────────────────────────────────────────────────────────────
function Planner({ session }) {
  const userId = session.user.id

  // ── Core state ──
  const [tasks, setTasks] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || {} }
    catch { return {} }
  })
  const [syncSt, setSyncSt] = useState('syncing')
  const [weekOff, setWeekOff] = useState(0)
  const [dayOffset, setDayOffset] = useState(0)
  const [view, setView] = useState('week')
  const [mob, setMob] = useState(window.innerWidth < 768)
  const [mobDay, setMobDay] = useState(() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })
  const [inputVals, setInputVals] = useState({})
  const [dragItem, setDragItem] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [expTask, setExpTask] = useState(null)
  const [atFilter, setAtFilter] = useState('all')
  const [impData, setImpData] = useState(null)

  const touchRef = useRef(null)
  const fileRef = useRef(null)

  // ── Responsive ──
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // ── Cache tasks to localStorage whenever they change ──
  useEffect(() => {
    localStorage.setItem(CACHE_KEY, JSON.stringify(tasks))
  }, [tasks])

  // ── Load from Supabase + realtime subscription ──
  const loadTasks = useCallback(async () => {
    setSyncSt('syncing')
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true })
    if (error) {
      console.error('Load error:', error)
      setSyncSt('error')
      return
    }
    const map = rowsToMap(data)
    setTasks(map)
    setSyncSt('synced')
  }, [])

  useEffect(() => {
    loadTasks()

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
        () => loadTasks()
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [userId, loadTasks])

  // ── Helpers ──
  function getWeekDates() {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const dow = today.getDay()
    const diff = dow === 0 ? -6 : 1 - dow
    const start = new Date(today)
    start.setDate(today.getDate() + diff + weekOff * 7)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start); d.setDate(start.getDate() + i); return d
    })
  }

  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayStr = getDateStr(today)
  const weekDates = getWeekDates()

  function nextTime(ds, isToday) {
    let st = 540
    if (isToday) { const n = new Date(); st = Math.max(n.getHours() * 60 + n.getMinutes() + 10, 540) }
    const dt = tasks[ds] || []
    if (!dt.length) return st
    const sorted = dt.slice().sort((a, b) => a.startTime - b.startTime)
    return Math.max(sorted[sorted.length - 1].endTime, st)
  }

  function nextPosition(ds) {
    const dt = tasks[ds] || []
    if (!dt.length) return 0
    return Math.max(...dt.map(t => t.position ?? 0)) + 1000
  }

  // ── CRUD — optimistic then Supabase ──

  async function addTask(ds) {
    const txt = inputVals[ds]
    if (!txt?.trim()) return
    const dur = 30
    const st = nextTime(ds, ds === todayStr)
    const newTask = {
      id: crypto.randomUUID(),
      text: txt.trim(),
      duration: dur,
      startTime: st,
      endTime: st + dur,
      completed: false,
      position: nextPosition(ds),
    }
    setTasks(prev => ({ ...prev, [ds]: [...(prev[ds] || []), newTask] }))
    setInputVals(prev => ({ ...prev, [ds]: '' }))

    setSyncSt('syncing')
    const { error } = await supabase.from('tasks').insert(taskToRow(newTask, ds, userId))
    setSyncSt(error ? 'error' : 'synced')
    if (error) console.error('Insert error:', error)
  }

  async function deleteTask(ds, id) {
    setTasks(prev => ({ ...prev, [ds]: (prev[ds] || []).filter(t => t.id !== id) }))

    setSyncSt('syncing')
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    setSyncSt(error ? 'error' : 'synced')
    if (error) console.error('Delete error:', error)
  }

  async function toggleComplete(ds, id) {
    const task = (tasks[ds] || []).find(t => t.id === id)
    if (!task) return
    const newVal = !task.completed
    setTasks(prev => ({
      ...prev,
      [ds]: (prev[ds] || []).map(t => t.id === id ? { ...t, completed: newVal } : t),
    }))

    setSyncSt('syncing')
    const { error } = await supabase.from('tasks').update({ completed: newVal }).eq('id', id)
    setSyncSt(error ? 'error' : 'synced')
    if (error) console.error('Update error:', error)
  }

  async function updateText(ds, id, text) {
    setTasks(prev => ({
      ...prev,
      [ds]: (prev[ds] || []).map(t => t.id === id ? { ...t, text } : t),
    }))

    setSyncSt('syncing')
    const { error } = await supabase.from('tasks').update({ title: text }).eq('id', id)
    setSyncSt(error ? 'error' : 'synced')
    if (error) console.error('Update error:', error)
  }

  async function updateDuration(ds, id, dur) {
    setTasks(prev => ({
      ...prev,
      [ds]: (prev[ds] || []).map(t =>
        t.id === id ? { ...t, duration: dur, endTime: t.startTime + dur } : t
      ),
    }))
    const task = (tasks[ds] || []).find(t => t.id === id)
    if (!task) return

    setSyncSt('syncing')
    const { error } = await supabase.from('tasks')
      .update({ duration: dur, end_time: task.startTime + dur })
      .eq('id', id)
    setSyncSt(error ? 'error' : 'synced')
    if (error) console.error('Update error:', error)
  }

  async function updateStart(ds, id, timeStr) {
    const parts = timeStr.split(':').map(Number)
    if (isNaN(parts[0]) || isNaN(parts[1])) return
    const ns = parts[0] * 60 + parts[1]
    setTasks(prev => ({
      ...prev,
      [ds]: (prev[ds] || []).map(t =>
        t.id === id ? { ...t, startTime: ns, endTime: ns + t.duration } : t
      ),
    }))

    setSyncSt('syncing')
    const task = (tasks[ds] || []).find(t => t.id === id)
    const { error } = await supabase.from('tasks')
      .update({ start_time: ns, end_time: ns + (task?.duration ?? 30) })
      .eq('id', id)
    setSyncSt(error ? 'error' : 'synced')
    if (error) console.error('Update error:', error)
  }

  async function moveTask(sds, id, tds) {
    if (sds === tds) return
    const task = (tasks[sds] || []).find(t => t.id === id)
    if (!task) return
    const ns = nextTime(tds, tds === todayStr)
    const moved = { ...task, startTime: ns, endTime: ns + task.duration, position: nextPosition(tds) }

    setTasks(prev => ({
      ...prev,
      [sds]: (prev[sds] || []).filter(t => t.id !== id),
      [tds]: [...(prev[tds] || []), moved],
    }))
    setExpTask(null)

    setSyncSt('syncing')
    const { error } = await supabase.from('tasks')
      .update({ date_str: tds, start_time: ns, end_time: moved.endTime, position: moved.position })
      .eq('id', id)
    setSyncSt(error ? 'error' : 'synced')
    if (error) console.error('Move error:', error)
  }

  // ── Drag & drop ──
  function onDragStart(ds, task) { setDragItem({ dateString: ds, task }) }
  function onDragEnd() { setDragItem(null); setDragOverId(null) }

  async function handleDrop(tds, beforeId) {
    if (!dragItem) return
    const { dateString: src, task } = dragItem

    if (beforeId === task.id || (!beforeId && src === tds)) {
      setDragItem(null); setDragOverId(null); return
    }

    const updTask = { ...task }
    if (src !== tds) {
      const ns = nextTime(tds, tds === todayStr)
      updTask.startTime = ns
      updTask.endTime = ns + task.duration
    }

    const srcTasks = (tasks[src] || []).filter(t => t.id !== task.id)
    let tgtTasks = src === tds ? srcTasks : [...(tasks[tds] || [])]

    if (beforeId) {
      const idx = tgtTasks.findIndex(t => t.id === beforeId)
      tgtTasks = idx >= 0
        ? [...tgtTasks.slice(0, idx), updTask, ...tgtTasks.slice(idx)]
        : [...tgtTasks, updTask]
    } else {
      tgtTasks = [...tgtTasks, updTask]
    }

    // Reindex positions
    const posTgt = tgtTasks.map((t, i) => ({ ...t, position: i * 1000 }))
    const posSrc = src !== tds ? srcTasks.map((t, i) => ({ ...t, position: i * 1000 })) : null

    setTasks(prev => {
      const next = { ...prev, [tds]: posTgt }
      if (src !== tds) next[src] = posSrc
      return next
    })
    setDragItem(null); setDragOverId(null)

    // Persist position + date changes
    setSyncSt('syncing')
    const ops = [
      ...posTgt.map(t => supabase.from('tasks')
        .update({ position: t.position, date_str: tds, start_time: t.startTime, end_time: t.endTime })
        .eq('id', t.id)
      ),
      ...(posSrc || []).map(t => supabase.from('tasks')
        .update({ position: t.position })
        .eq('id', t.id)
      ),
    ]
    const results = await Promise.all(ops)
    const errs = results.filter(r => r.error)
    setSyncSt(errs.length ? 'error' : 'synced')
    if (errs.length) console.error('Drag-drop errors:', errs)
  }

  // ── Export / Import ──
  function exportTasks() {
    const b = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' })
    const u = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = u; a.download = `tasks-backup-${getDateStr(new Date())}.json`; a.click()
    URL.revokeObjectURL(u)
  }

  function handleImport(e) {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const d = JSON.parse(ev.target.result)
        if (typeof d !== 'object' || !d || Array.isArray(d)) { alert('Invalid file'); return }
        setImpData(d)
      } catch { alert('Could not parse JSON') }
    }
    r.readAsText(f); e.target.value = ''
  }

  async function applyImport(mode) {
    if (!impData) return

    setSyncSt('syncing')
    if (mode === 'replace') {
      const { error } = await supabase.from('tasks').delete().eq('user_id', userId)
      if (error) { setSyncSt('error'); console.error('Delete all error:', error); return }
    }

    // Build rows from imported data (generate new UUIDs)
    const rows = []
    Object.keys(impData).forEach(ds => {
      ;(impData[ds] || []).forEach((t, i) => {
        rows.push({
          id: crypto.randomUUID(),
          user_id: userId,
          date_str: ds,
          title: t.text || t.title || '',
          duration: t.duration || 30,
          start_time: t.startTime ?? t.start_time ?? 540,
          end_time: t.endTime ?? t.end_time ?? 570,
          completed: !!t.completed,
          position: i * 1000,
        })
      })
    })

    if (rows.length) {
      const { error } = await supabase.from('tasks').insert(rows)
      if (error) { setSyncSt('error'); console.error('Import insert error:', error) }
    }

    setImpData(null)
    loadTasks()
  }

  // ── Touch swipe (mobile day navigation) ──
  function onTouchStart(e) { touchRef.current = e.touches[0].clientX }
  function onTouchEnd(e) {
    if (touchRef.current === null) return
    const d = e.changedTouches[0].clientX - touchRef.current
    if (Math.abs(d) > 50) {
      if (d > 0 && mobDay > 0) setMobDay(mobDay - 1)
      else if (d < 0 && mobDay < 6) setMobDay(mobDay + 1)
    }
    touchRef.current = null
  }

  // ── Sign out ──
  async function signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem(CACHE_KEY)
  }

  // ── Sync indicator ──
  const syncDot = { synced: '#4a4', syncing: '#ca4', local: '#888', error: '#c44', loading: '#888' }[syncSt] || '#888'
  const syncLbl = { synced: 'Synced', syncing: 'Syncing…', local: 'Local', error: 'Sync error', loading: 'Loading…' }[syncSt] || ''

  // ── Shared DayColumn props ──
  const dcp = {
    expandedTask: expTask,
    dragOverTaskId: dragOverId,
    draggedItem: dragItem,
    isMobile: mob,
    onInput: (ds, v) => setInputVals(prev => ({ ...prev, [ds]: v })),
    onAdd: addTask,
    onExpand: setExpTask,
    onToggle: toggleComplete,
    onDelete: deleteTask,
    onUpdateText: updateText,
    onUpdateStart: updateStart,
    onUpdateDur: updateDuration,
    onMove: moveTask,
    onDragStart,
    onDragEnd,
    onSetDragOver: setDragOverId,
    onDropOnDay: ds => handleDrop(ds),
    onDropOnTask: (ds, tid) => handleDrop(ds, tid),
  }

  // ── Header button style ──
  const bBase = {
    backgroundColor: 'transparent',
    border: '1px solid ' + T.borderSubtle,
    borderRadius: T.rSm,
    color: T.textSecondary,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  }
  const bPad = mob ? '8px 12px' : '8px 16px'

  // ── View tab strip ──
  const viewTabs = (
    <div
      style={{
        display: 'flex',
        gap: '4px',
        backgroundColor: T.bgSurfaceAlt,
        borderRadius: '20px',
        padding: '3px',
        order: mob ? -1 : 0,
        alignSelf: mob ? 'stretch' : 'auto',
      }}
    >
      {[['week', 'Weekly'], ['allTasks', 'All Tasks']].map(([v, label]) => {
        const active = view === v
        return (
          <button
            key={v}
            onClick={() => setView(v)}
            style={{
              flex: mob ? 1 : undefined,
              backgroundColor: active ? T.accentGlow : 'transparent',
              border: '1px solid ' + (active ? T.accentMuted : 'transparent'),
              borderRadius: '18px',
              padding: '6px 16px',
              color: active ? T.accent : T.textSecondary,
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )

  // ── Week nav ──
  const weekNav = view === 'week' ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
      <button onClick={() => setWeekOff(w => w - 1)} style={{ ...bBase, padding: bPad }}>←</button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: mob ? '160px' : '220px' }}>
        <span style={{ fontSize: mob ? '15px' : '18px', fontWeight: '600', color: T.textPrimary, letterSpacing: '0.02em', textAlign: 'center' }}>
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          {' – '}
          {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        {weekOff === 0 && (
          <span style={{ fontSize: '10px', color: T.accent, fontWeight: '600', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Current Week
          </span>
        )}
      </div>
      <button
        onClick={() => setWeekOff(0)}
        style={{
          ...bBase, padding: bPad, fontSize: '12px',
          backgroundColor: weekOff === 0 ? T.accentGlow : 'transparent',
          border: '1px solid ' + (weekOff === 0 ? T.accentMuted : T.borderSubtle),
          color: weekOff === 0 ? T.accent : T.textSecondary,
        }}
      >
        Today
      </button>
      <button onClick={() => setWeekOff(w => w + 1)} style={{ ...bBase, padding: bPad }}>→</button>
    </div>
  ) : null

  // ── Toolbar ──
  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <button
        onClick={exportTasks}
        style={{ ...bBase, padding: '6px 10px', fontSize: '11px' }}
      >
        ↓ Export
      </button>
      <button
        onClick={() => fileRef.current?.click()}
        style={{ ...bBase, padding: '6px 10px', fontSize: '11px' }}
      >
        ↑ Import
      </button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />

      <div
        style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}
        title={syncLbl}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: syncDot, boxShadow: '0 0 4px ' + syncDot }} />
        <span style={{ fontSize: '10px', color: T.textMuted }}>{syncLbl}</span>
      </div>

      <button
        onClick={signOut}
        style={{ ...bBase, padding: '6px 10px', fontSize: '11px', marginLeft: '4px' }}
      >
        Sign out
      </button>
    </div>
  )

  // ─── RENDER ───
  return (
    <div
      style={{
        backgroundColor: T.bgDeep,
        color: T.textPrimary,
        minHeight: '100vh',
        padding: mob ? '12px' : '20px 24px',
        fontFamily: T.font,
        letterSpacing: '0.01em',
      }}
    >
      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: mob ? 'column' : 'row',
            alignItems: 'center',
            gap: mob ? '10px' : '12px',
            marginBottom: mob ? '16px' : '24px',
            padding: '8px 0',
          }}
        >
          {viewTabs}
          {weekNav}
          {toolbar}
        </div>

        {/* Weekly view */}
        {view === 'week' && (
          mob ? (
            <>
              {/* Mobile day selector */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', justifyContent: 'space-between' }}>
                {weekDates.map((date, idx) => {
                  const ds = getDateStr(date)
                  const active = idx === mobDay
                  const isT = ds === todayStr
                  return (
                    <button
                      key={ds}
                      onClick={() => setMobDay(idx)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        backgroundColor: active ? T.accentGlow : 'transparent',
                        border: '1px solid ' + (active ? T.accentMuted : 'transparent'),
                        borderRadius: T.rSm,
                        color: active ? T.accent : T.textSecondary,
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        position: 'relative',
                      }}
                    >
                      <span>{['M','T','W','T','F','S','S'][idx]}</span>
                      <span style={{ fontSize: '10px', fontWeight: '400', color: active ? T.accent : T.textMuted }}>{date.getDate()}</span>
                      {isT && <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: T.accent, position: 'absolute', bottom: '4px' }} />}
                    </button>
                  )
                })}
              </div>
              {/* Single day */}
              <div
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
                style={{ minHeight: '300px' }}
              >
                {(() => {
                  const md = weekDates[mobDay]
                  const mds = getDateStr(md)
                  const mdow = md.getDay()
                  return (
                    <DayColumn
                      key={mds}
                      dateString={mds}
                      date={md}
                      isToday={mds === todayStr}
                      isWeekend={mdow === 0 || mdow === 6}
                      dayTasks={tasks[mds] || []}
                      inputValue={inputVals[mds] || ''}
                      {...dcp}
                    />
                  )
                })()}
              </div>
            </>
          ) : (
            <>
              {/* Desktop 4-day navigator */}
              {(() => {
                const daysToShow = 4
                const maxOff = 7 - daysToShow
                const visibleDates = weekDates.slice(dayOffset, dayOffset + daysToShow)
                return (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                        justifyContent: 'center',
                        padding: '12px',
                        backgroundColor: T.bgSurfaceAlt,
                        borderRadius: '12px',
                        maxWidth: '600px',
                        margin: '0 auto 20px auto',
                      }}
                    >
                      <button
                        onClick={() => { if (dayOffset > 0) setDayOffset(o => o - 1) }}
                        style={{ ...bBase, padding: '8px 14px', opacity: dayOffset === 0 ? 0.3 : 1, cursor: dayOffset === 0 ? 'default' : 'pointer', fontSize: '16px' }}
                      >
                        ←
                      </button>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {weekDates.map((date, idx) => {
                          const ds = getDateStr(date)
                          const isVisible = idx >= dayOffset && idx < dayOffset + daysToShow
                          const isT = ds === todayStr
                          return (
                            <button
                              key={ds}
                              onClick={() => {
                                if (idx < daysToShow) setDayOffset(0)
                                else setDayOffset(Math.min(idx, maxOff))
                              }}
                              style={{
                                width: '42px',
                                height: '42px',
                                backgroundColor: isVisible ? (isT ? T.accent : T.accentGlow) : 'transparent',
                                border: isVisible ? 'none' : '1px solid ' + T.borderSubtle,
                                borderRadius: '8px',
                                color: isVisible ? (isT ? '#fff' : T.accent) : T.textMuted,
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '700',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '2px',
                                position: 'relative',
                                transition: T.trF,
                                boxShadow: isVisible ? (isT ? T.shGlow : 'none') : 'none',
                              }}
                            >
                              <span style={{ fontSize: '10px', fontWeight: '600' }}>{['M','T','W','T','F','S','S'][idx]}</span>
                              <span style={{ fontSize: '14px' }}>{date.getDate()}</span>
                              {isT && !isVisible && (
                                <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: T.accent, position: 'absolute', bottom: '4px' }} />
                              )}
                            </button>
                          )
                        })}
                      </div>

                      <button
                        onClick={() => { if (dayOffset < maxOff) setDayOffset(o => o + 1) }}
                        style={{ ...bBase, padding: '8px 14px', opacity: dayOffset >= maxOff ? 0.3 : 1, cursor: dayOffset >= maxOff ? 'default' : 'pointer', fontSize: '16px' }}
                      >
                        →
                      </button>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                        gap: '14px',
                        maxWidth: '1600px',
                        margin: '0 auto',
                      }}
                    >
                      {visibleDates.map(date => {
                        const ds = getDateStr(date)
                        const dow = date.getDay()
                        return (
                          <DayColumn
                            key={ds}
                            dateString={ds}
                            date={date}
                            isToday={ds === todayStr}
                            isWeekend={dow === 0 || dow === 6}
                            dayTasks={tasks[ds] || []}
                            inputValue={inputVals[ds] || ''}
                            {...dcp}
                          />
                        )
                      })}
                    </div>
                  </>
                )
              })()}
            </>
          )
        )}

        {/* All tasks view */}
        {view === 'allTasks' && (
          <AllTasksView
            tasks={tasks}
            expandedTask={expTask}
            isMobile={mob}
            filter={atFilter}
            setFilter={setAtFilter}
            onExpand={setExpTask}
            onToggle={toggleComplete}
            onDelete={deleteTask}
            onUpdateText={updateText}
            onUpdateStart={updateStart}
            onUpdateDur={updateDuration}
            onMove={moveTask}
          />
        )}
      </div>

      {/* Import modal */}
      {impData && (
        <ImportModal
          data={impData}
          onApply={applyImport}
          onCancel={() => setImpData(null)}
        />
      )}
    </div>
  )
}
