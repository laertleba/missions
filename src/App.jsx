import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { supabase } from './lib/supabase'
import { T } from './lib/theme'
import { getDateStr, rowToItem, collectSubtreeIds, computeDepth } from './lib/utils'
import Auth from './components/Auth'
import DayColumn from './components/DayColumn'
import MissionsView from './components/MissionsView'
import QuestsView from './components/QuestsView'
import ImportModal from './components/ImportModal'
import MissionEditModal from './components/MissionEditModal'

const CACHE_KEY = 'missions_items_cache'

export default function App() {
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null
  if (!session) return <Auth />
  return <Planner session={session} />
}

// ═════════════════════════════════════════════════════════════
function Planner({ session }) {
  const userId = session.user.id

  // ── State ──
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CACHE_KEY)) || [] }
    catch { return [] }
  })
  const [syncSt, setSyncSt] = useState('syncing')
  const [view, setView] = useState('missions')
  const [weekOff, setWeekOff] = useState(0)
  // Default dayOffset so today is in the visible 4-day window
  const [dayOffset, setDayOffset] = useState(() => {
    const dow = new Date().getDay()
    const idx = dow === 0 ? 6 : dow - 1 // Mon=0 … Sun=6
    return Math.min(idx, 3)             // clamp to max offset (7-4)
  })
  const [mob, setMob] = useState(window.innerWidth < 768)
  const [mobDay, setMobDay] = useState(() => { const d = new Date().getDay(); return d === 0 ? 6 : d - 1 })
  const [dragItem, setDragItem] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)
  const [expTask, setExpTask] = useState(null)
  const [impData, setImpData] = useState(null)
  const [editingMission, setEditingMission] = useState(null) // mission object | null
  const [selectedQuestId, setSelectedQuestId] = useState(null)
  const [questFilter, setQuestFilter] = useState('active')

  const touchRef = useRef(null)
  const fileRef = useRef(null)

  const setSync = setSyncSt

  // ── Responsive ──
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  // ── Cache ──
  useEffect(() => { localStorage.setItem(CACHE_KEY, JSON.stringify(items)) }, [items])

  // ── Load + realtime ──
  const loadItems = useCallback(async () => {
    setSync('syncing')
    const { data, error } = await supabase.from('items').select('*').order('sort_order', { ascending: true })
    if (error) { console.error('Load error:', error); setSync('error'); return }
    setItems(data.map(rowToItem))
    setSync('synced')
  }, [])

  useEffect(() => {
    loadItems()
    const channel = supabase
      .channel('items-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items', filter: `user_id=eq.${userId}` }, () => loadItems())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [userId, loadItems])

  // ── Derivations ──
  const quests = useMemo(() => items.filter(i => i.type === 'quest'), [items])
  const activeQuests = useMemo(() => quests.filter(q => !q.archived), [quests])

  const childrenByParent = useMemo(() => {
    const m = {}
    for (const it of items) {
      if (it.type === 'mission' && it.parentId) (m[it.parentId] ||= []).push(it)
    }
    for (const k in m) m[k].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.createdAt < b.createdAt ? -1 : 1))
    return m
  }, [items])

  const missionsByDate = useMemo(() => {
    const m = {}
    for (const it of items) {
      if (it.type === 'mission' && it.scheduledDate) (m[it.scheduledDate] ||= []).push(it)
    }
    for (const k in m) m[k].sort((a, b) => (a.sortOrder - b.sortOrder) || (a.startTime - b.startTime))
    return m
  }, [items])

  // ── Default quest selection ──
  useEffect(() => {
    if (!selectedQuestId && quests.length) setSelectedQuestId((quests.find(q => !q.archived) || quests[0]).id)
  }, [quests, selectedQuestId])

  // ── Date helpers ──
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const todayStr = getDateStr(today)

  function getWeekDates() {
    const t = new Date(); t.setHours(0, 0, 0, 0)
    const dow = t.getDay()
    const diff = dow === 0 ? -6 : 1 - dow
    const start = new Date(t); start.setDate(t.getDate() + diff + weekOff * 7)
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d })
  }
  const weekDates = getWeekDates()

  function goToToday() {
    setWeekOff(0)
    const dow = new Date().getDay()
    const idx = dow === 0 ? 6 : dow - 1
    setDayOffset(Math.min(idx, 3))
  }

  function nextTime(ds, isToday) {
    let st = 540
    if (isToday) { const n = new Date(); st = Math.max(n.getHours() * 60 + n.getMinutes() + 10, 540) }
    const dt = missionsByDate[ds] || []
    if (!dt.length) return st
    const last = dt.slice().sort((a, b) => a.startTime - b.startTime).at(-1)
    return Math.max(last.endTime, st)
  }
  function nextSortInDate(ds) {
    const dt = missionsByDate[ds] || []
    return dt.length ? Math.max(...dt.map(t => t.sortOrder)) + 1000 : 0
  }
  function nextSiblingSort(parentId) {
    const kids = childrenByParent[parentId] || []
    return kids.length ? Math.max(...kids.map(t => t.sortOrder)) + 1000 : 0
  }
  function nextQuestSort() {
    return quests.length ? Math.max(...quests.map(q => q.sortOrder)) + 1000 : 0
  }

  function mkMission({ id, title, questId, parentId, scheduledDate = null, startTime = null, endTime = null, sortOrder }) {
    return {
      id, type: 'mission', title, text: title, completed: false, archived: false, starred: false,
      questId, parentId, scheduledDate, startTime, endTime,
      duration: startTime != null && endTime != null ? endTime - startTime : 30,
      sortOrder, createdAt: new Date().toISOString(),
    }
  }
  function missionInsert(m) {
    return {
      id: m.id, user_id: userId, type: 'mission', title: m.title,
      quest_id: m.questId, parent_id: m.parentId, scheduled_date: m.scheduledDate,
      start_time: m.startTime, end_time: m.endTime, sort_order: m.sortOrder, completed: m.completed,
    }
  }

  async function runWrite(promise) {
    setSync('syncing')
    const { error } = await promise
    setSync(error ? 'error' : 'synced')
    if (error) console.error('Write error:', error)
  }

  // ── Quest CRUD ──
  async function addQuest(title) {
    const id = crypto.randomUUID()
    const q = {
      id, type: 'quest', title, text: title, completed: false, archived: false,
      questId: null, parentId: null, scheduledDate: null, startTime: null, endTime: null,
      duration: 30, sortOrder: nextQuestSort(), createdAt: new Date().toISOString(),
    }
    setItems(prev => [...prev, q])
    setSelectedQuestId(id)
    await runWrite(supabase.from('items').insert({ id, user_id: userId, type: 'quest', title, sort_order: q.sortOrder }))
  }

  async function completeQuest(quest) {
    setItems(prev => prev.map(it => {
      if (it.id === quest.id) return { ...it, completed: true, archived: true }
      if (it.questId === quest.id) return { ...it, completed: true }
      return it
    }))
    await runWrite(supabase.rpc('complete_quest', { q: quest.id }))
  }

  async function reactivateQuest(quest) {
    setItems(prev => prev.map(it => it.id === quest.id ? { ...it, completed: false, archived: false } : it))
    await runWrite(supabase.from('items').update({ completed: false, archived: false, completed_at: null }).eq('id', quest.id))
  }

  async function renameItem(id, title) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, title, text: title } : it))
    await runWrite(supabase.from('items').update({ title }).eq('id', id))
  }

  async function toggleStar(item) {
    const newStarred = !item.starred
    setItems(prev => prev.map(it => it.id === item.id ? { ...it, starred: newStarred } : it))
    await runWrite(supabase.from('items').update({ starred: newStarred }).eq('id', item.id))
  }

  // ── Mission CRUD ──
  async function addTopMission(quest, title) {
    const m = mkMission({ id: crypto.randomUUID(), title, questId: quest.id, parentId: quest.id, sortOrder: nextSiblingSort(quest.id) })
    setItems(prev => [...prev, m])
    await runWrite(supabase.from('items').insert(missionInsert(m)))
  }

  async function addTopMissionById(questId, title) {
    const quest = quests.find(q => q.id === questId)
    if (quest) await addTopMission(quest, title)
  }

  async function addSubMission(parent, title) {
    const m = mkMission({ id: crypto.randomUUID(), title, questId: parent.questId, parentId: parent.id, sortOrder: nextSiblingSort(parent.id) })
    setItems(prev => [...prev, m])
    await runWrite(supabase.from('items').insert(missionInsert(m)))
  }

  // Edit all fields of a mission in one call
  async function updateMission(id, { title, scheduledDate, startTime, duration }) {
    const item = items.find(it => it.id === id)
    if (!item) return
    const newStart = startTime !== undefined ? startTime : item.startTime
    const newDur = duration !== undefined ? Number(duration) : item.duration
    const newEnd = newStart != null ? newStart + newDur : null
    setItems(prev => prev.map(it => it.id !== id ? it : {
      ...it,
      title: title ?? it.title, text: title ?? it.title,
      scheduledDate: scheduledDate !== undefined ? (scheduledDate || null) : it.scheduledDate,
      startTime: newStart, endTime: newEnd, duration: newDur,
    }))
    await runWrite(supabase.from('items').update({
      title: title ?? item.title,
      scheduled_date: scheduledDate !== undefined ? (scheduledDate || null) : item.scheduledDate,
      start_time: newStart ?? null,
      end_time: newEnd,
    }).eq('id', id))
  }

  async function toggleComplete(item) {
    if (!item.completed) {
      if (item.type === 'quest') return completeQuest(item)
      const ids = new Set(collectSubtreeIds(items, item.id))
      setItems(prev => prev.map(it => ids.has(it.id) ? { ...it, completed: true } : it))
      await runWrite(supabase.rpc('complete_subtree', { root: item.id }))
    } else {
      const patch = item.type === 'quest'
        ? { completed: false, archived: false, completed_at: null }
        : { completed: false, completed_at: null }
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, completed: false, archived: it.type === 'quest' ? false : it.archived } : it))
      await runWrite(supabase.from('items').update(patch).eq('id', item.id))
    }
  }

  async function deleteItem(item) {
    const ids = new Set(collectSubtreeIds(items, item.id))
    setItems(prev => prev.filter(it => !ids.has(it.id)))
    await runWrite(supabase.from('items').delete().eq('id', item.id))
  }

  // TaskCard legacy field handlers (ds param ignored for items model)
  async function updateText(_ds, id, text) {
    setItems(prev => prev.map(it => it.id === id ? { ...it, title: text, text } : it))
    await runWrite(supabase.from('items').update({ title: text }).eq('id', id))
  }
  async function updateStart(_ds, id, timeStr) {
    const p = timeStr.split(':').map(Number)
    if (isNaN(p[0]) || isNaN(p[1])) return
    const ns = p[0] * 60 + p[1]
    let et = ns + 30
    setItems(prev => prev.map(it => { if (it.id !== id) return it; et = ns + it.duration; return { ...it, startTime: ns, endTime: et } }))
    await runWrite(supabase.from('items').update({ start_time: ns, end_time: et }).eq('id', id))
  }
  async function updateDuration(_ds, id, dur) {
    let et = 0
    setItems(prev => prev.map(it => { if (it.id !== id) return it; et = it.startTime + dur; return { ...it, duration: dur, endTime: et } }))
    await runWrite(supabase.from('items').update({ end_time: et }).eq('id', id))
  }
  async function moveTask(_ds, id, newDate) {
    const task = items.find(it => it.id === id)
    if (!task || task.scheduledDate === newDate) return
    const ns = nextTime(newDate, newDate === todayStr)
    const et = ns + task.duration
    const sort = nextSortInDate(newDate)
    setItems(prev => prev.map(it => it.id === id ? { ...it, scheduledDate: newDate, startTime: ns, endTime: et, sortOrder: sort } : it))
    setExpTask(null)
    await runWrite(supabase.from('items').update({ scheduled_date: newDate, start_time: ns, end_time: et, sort_order: sort }).eq('id', id))
  }

  // ── Drag & drop ──
  function onDragStart(ds, task) { setDragItem({ dateString: ds, task }) }
  function onDragEnd() { setDragItem(null); setDragOverId(null) }

  async function handleDrop(tds, beforeId) {
    if (!dragItem) return
    const { dateString: src, task } = dragItem
    if (beforeId === task.id || (!beforeId && src === tds)) { setDragItem(null); setDragOverId(null); return }

    const moved = { ...task }
    if (src !== tds) {
      const ns = nextTime(tds, tds === todayStr)
      moved.startTime = ns; moved.endTime = ns + task.duration; moved.scheduledDate = tds
    }
    const srcList = (missionsByDate[src] || []).filter(t => t.id !== task.id)
    let tgtList = src === tds ? srcList.slice() : (missionsByDate[tds] || []).slice()
    if (beforeId) {
      const idx = tgtList.findIndex(t => t.id === beforeId)
      tgtList = idx >= 0 ? [...tgtList.slice(0, idx), moved, ...tgtList.slice(idx)] : [...tgtList, moved]
    } else {
      tgtList = [...tgtList, moved]
    }
    const posTgt = tgtList.map((t, i) => ({ ...t, sortOrder: i * 1000 }))
    const posSrc = src !== tds ? srcList.map((t, i) => ({ ...t, sortOrder: i * 1000 })) : null

    setItems(prev => {
      const map = new Map(prev.map(it => [it.id, it]))
      for (const t of posTgt) map.set(t.id, { ...map.get(t.id), scheduledDate: tds, sortOrder: t.sortOrder, startTime: t.startTime, endTime: t.endTime })
      if (posSrc) for (const t of posSrc) map.set(t.id, { ...map.get(t.id), sortOrder: t.sortOrder })
      return Array.from(map.values())
    })
    setDragItem(null); setDragOverId(null)

    setSync('syncing')
    const ops = [
      ...posTgt.map(t => supabase.from('items').update({ sort_order: t.sortOrder, scheduled_date: tds, start_time: t.startTime, end_time: t.endTime }).eq('id', t.id)),
      ...(posSrc || []).map(t => supabase.from('items').update({ sort_order: t.sortOrder }).eq('id', t.id)),
    ]
    const res = await Promise.all(ops)
    setSync(res.some(r => r.error) ? 'error' : 'synced')
  }

  // ── Export / Import ──
  function exportItems() {
    const rows = items.map(it => ({
      id: it.id, type: it.type, title: it.title, completed: it.completed, archived: it.archived,
      starred: it.starred || false,
      quest_id: it.questId, parent_id: it.parentId, scheduled_date: it.scheduledDate,
      start_time: it.startTime, end_time: it.endTime, sort_order: it.sortOrder,
    }))
    const blob = new Blob([JSON.stringify({ version: 2, items: rows }, null, 2)], { type: 'application/json' })
    const u = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = u; a.download = `missions-backup-${getDateStr(new Date())}.json`; a.click()
    URL.revokeObjectURL(u)
  }

  function handleImportFile(e) {
    const f = e.target.files[0]; if (!f) return
    const r = new FileReader()
    r.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target.result)
        const arr = Array.isArray(parsed) ? parsed : parsed.items
        if (!Array.isArray(arr)) { alert('Unrecognised backup format.'); return }
        setImpData({ items: arr })
      } catch { alert('Could not parse JSON') }
    }
    r.readAsText(f); e.target.value = ''
  }

  async function applyImport(mode) {
    if (!impData) return
    setSync('syncing')
    if (mode === 'replace') {
      const { error } = await supabase.from('items').delete().eq('user_id', userId)
      if (error) { setSync('error'); console.error(error); return }
    }
    const src = impData.items
    const idMap = new Map(src.map(it => [it.id, crypto.randomUUID()]))
    const byId = Object.fromEntries(src.map(it => [it.id, it]))
    const depthCache = {}
    const rows = src.map(it => ({
      id: idMap.get(it.id), user_id: userId, type: it.type, title: it.title || '',
      completed: !!it.completed, archived: !!it.archived,
      starred: !!it.starred,
      completed_at: it.completed ? new Date().toISOString() : null,
      quest_id: it.quest_id ? idMap.get(it.quest_id) : null,
      parent_id: it.parent_id ? idMap.get(it.parent_id) : null,
      scheduled_date: it.scheduled_date ?? null,
      start_time: it.start_time ?? null, end_time: it.end_time ?? null,
      sort_order: it.sort_order ?? 0,
      _depth: computeDepth(it, byId, depthCache),
    }))
    const maxDepth = rows.reduce((m, r) => Math.max(m, r._depth), 0)
    for (let d = 0; d <= maxDepth; d++) {
      const batch = rows.filter(r => r._depth === d).map(({ _depth, ...r }) => r)
      if (!batch.length) continue
      const { error } = await supabase.from('items').insert(batch)
      if (error) { setSync('error'); console.error('Import error at depth', d, error); break }
    }
    setImpData(null)
    loadItems()
  }

  // ── Touch swipe ──
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

  async function signOut() {
    await supabase.auth.signOut()
    localStorage.removeItem(CACHE_KEY)
  }

  function jumpToQuest(qid) {
    const q = quests.find(x => x.id === qid)
    setQuestFilter(q && q.archived ? 'archived' : 'active')
    setSelectedQuestId(qid)
    setView('quests')
  }

  // ── Shared mission handlers ──
  const missionHandlers = {
    onToggle: toggleComplete,
    onDelete: deleteItem,
    onAddSub: addSubMission,
    onEdit: setEditingMission,
    onStar: toggleStar,
  }

  // ── Sync indicator ──
  const syncDot = { synced: T.accent, syncing: T.amber, error: '#ff5a5a' }[syncSt] || T.textMuted
  const syncLbl = { synced: 'Synced', syncing: 'Syncing…', error: 'Sync error' }[syncSt] || ''

  // ── Shared DayColumn props ──
  const dcp = {
    expandedTask: expTask, dragOverTaskId: dragOverId, draggedItem: dragItem, isMobile: mob,
    onExpand: setExpTask,
    onToggle: (_ds, id) => toggleComplete(items.find(i => i.id === id)),
    onDelete: (_ds, id) => deleteItem(items.find(i => i.id === id)),
    onUpdateText: updateText, onUpdateStart: updateStart, onUpdateDur: updateDuration, onMove: moveTask,
    onDragStart, onDragEnd, onSetDragOver: setDragOverId,
    onDropOnDay: ds => handleDrop(ds), onDropOnTask: (ds, tid) => handleDrop(ds, tid),
  }

  const bBase = { backgroundColor: 'transparent', border: '1px solid ' + T.borderSubtle, borderRadius: T.rSm, color: T.textSecondary, cursor: 'pointer', fontSize: '12px', fontFamily: T.fontMono }
  const bPad = mob ? '8px 12px' : '8px 16px'

  // ── Nav tabs ──
  const navTabs = (
    <div style={{ display: 'flex', gap: '4px', backgroundColor: T.bgSurfaceAlt, borderRadius: '4px', padding: '3px', order: mob ? -1 : 0, alignSelf: mob ? 'stretch' : 'auto', border: '1px solid ' + T.borderSubtle }}>
      {[['missions', 'Missions'], ['quests', 'Quests'], ['week', 'Weekly']].map(([v, label]) => {
        const active = view === v
        return (
          <button key={v} onClick={() => setView(v)} style={{
            flex: mob ? 1 : undefined,
            backgroundColor: active ? T.accentGlow : 'transparent',
            border: '1px solid ' + (active ? T.accentMuted : 'transparent'),
            borderRadius: '3px', padding: mob ? '6px 10px' : '6px 16px',
            color: active ? T.accent : T.textSecondary,
            textShadow: active ? T.textGlow : 'none',
            cursor: 'pointer', fontSize: mob ? '11px' : '12px', fontFamily: T.fontMono,
            letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap',
          }}>
            {label}
          </button>
        )
      })}
    </div>
  )

  const weekNav = view === 'week' ? (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'center' }}>
      <button onClick={() => setWeekOff(w => w - 1)} style={{ ...bBase, padding: bPad }}>←</button>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: mob ? '140px' : '220px' }}>
        <span style={{ fontSize: mob ? '12px' : '16px', fontWeight: '600', color: T.textPrimary, fontFamily: T.fontMono, letterSpacing: '0.04em', textAlign: 'center' }}>
          {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{' – '}{weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        {weekOff === 0 && <span style={{ fontSize: '9px', color: T.accent, fontWeight: '600', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.12em', textShadow: T.textGlow }}>Current Week</span>}
      </div>
      <button
        onClick={goToToday}
        style={{ ...bBase, padding: bPad, backgroundColor: weekOff === 0 ? T.accentGlow : 'transparent', border: '1px solid ' + (weekOff === 0 ? T.accentMuted : T.borderSubtle), color: weekOff === 0 ? T.accent : T.textSecondary }}
      >Today</button>
      <button onClick={() => setWeekOff(w => w + 1)} style={{ ...bBase, padding: bPad }}>→</button>
    </div>
  ) : <div style={{ flex: 1 }} />

  const toolbar = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
      <button onClick={exportItems} style={{ ...bBase, padding: '6px 10px', fontSize: '11px' }}>↓ Export</button>
      <button onClick={() => fileRef.current?.click()} style={{ ...bBase, padding: '6px 10px', fontSize: '11px' }}>↑ Import</button>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }} title={syncLbl}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: syncDot, boxShadow: '0 0 5px ' + syncDot }} />
        <span style={{ fontSize: '10px', color: T.textMuted, fontFamily: T.fontMono }}>{syncLbl}</span>
      </div>
      <button onClick={signOut} style={{ ...bBase, padding: '6px 10px', fontSize: '11px', marginLeft: '4px' }}>Sign out</button>
    </div>
  )

  // ── Render ──
  return (
    <div style={{ backgroundColor: T.bgDeep, color: T.textPrimary, minHeight: '100vh', padding: mob ? '10px' : '20px 24px', fontFamily: T.font, letterSpacing: '0.01em' }}>
      <div style={{ maxWidth: '1800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: mob ? 'column' : 'row', alignItems: 'center', gap: mob ? '8px' : '12px', marginBottom: mob ? '12px' : '24px', padding: '6px 0' }}>
          {navTabs}
          {weekNav}
          {toolbar}
        </div>

        {/* ── WEEKLY ── */}
        {view === 'week' && (mob ? (
          <>
            <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
              {weekDates.map((date, idx) => {
                const ds = getDateStr(date), active = idx === mobDay, isT = ds === todayStr
                return (
                  <button key={ds} onClick={() => setMobDay(idx)} style={{
                    flex: 1, padding: '8px 0',
                    backgroundColor: active ? T.accentGlow : 'transparent',
                    border: '1px solid ' + (active ? T.accentMuted : 'transparent'),
                    borderRadius: T.rSm,
                    color: active ? T.accent : T.textSecondary, cursor: 'pointer',
                    fontFamily: T.fontMono,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', position: 'relative',
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: '700' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}</span>
                    <span style={{ fontSize: '10px', color: active ? T.accent : T.textMuted }}>{date.getDate()}</span>
                    {isT && <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: T.accent, position: 'absolute', bottom: '3px' }} />}
                  </button>
                )
              })}
            </div>
            <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} style={{ minHeight: '200px' }}>
              {(() => {
                const md = weekDates[mobDay], mds = getDateStr(md), mdow = md.getDay()
                return <DayColumn key={mds} dateString={mds} date={md} isToday={mds === todayStr} isWeekend={mdow === 0 || mdow === 6} dayTasks={missionsByDate[mds] || []} {...dcp} />
              })()}
            </div>
          </>
        ) : (() => {
          const daysToShow = 4, maxOff = 7 - daysToShow
          const visibleDates = weekDates.slice(dayOffset, dayOffset + daysToShow)
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', padding: '10px 12px', backgroundColor: T.bgSurfaceAlt, borderRadius: '8px', maxWidth: '560px', margin: '0 auto 18px auto', border: '1px solid ' + T.borderSubtle }}>
                <button onClick={() => { if (dayOffset > 0) setDayOffset(o => o - 1) }} style={{ ...bBase, padding: '6px 12px', opacity: dayOffset === 0 ? 0.3 : 1, cursor: dayOffset === 0 ? 'default' : 'pointer', fontSize: '16px' }}>←</button>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {weekDates.map((date, idx) => {
                    const ds = getDateStr(date), isVisible = idx >= dayOffset && idx < dayOffset + daysToShow, isT = ds === todayStr
                    return (
                      <button key={ds} onClick={() => { if (idx < daysToShow) setDayOffset(0); else setDayOffset(Math.min(idx, maxOff)) }} style={{
                        width: '38px', height: '38px',
                        backgroundColor: isVisible ? (isT ? T.accent : T.accentGlow) : 'transparent',
                        border: isVisible ? 'none' : '1px solid ' + T.borderSubtle, borderRadius: '6px',
                        color: isVisible ? (isT ? '#06140b' : T.accent) : T.textMuted, cursor: 'pointer',
                        fontSize: '12px', fontWeight: '700', fontFamily: T.fontMono,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px',
                        position: 'relative', transition: T.trF, boxShadow: isVisible && isT ? T.shGlow : 'none',
                      }}>
                        <span style={{ fontSize: '9px' }}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][idx]}</span>
                        <span style={{ fontSize: '13px' }}>{date.getDate()}</span>
                        {isT && !isVisible && <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: T.accent, position: 'absolute', bottom: '3px' }} />}
                      </button>
                    )
                  })}
                </div>
                <button onClick={() => { if (dayOffset < maxOff) setDayOffset(o => o + 1) }} style={{ ...bBase, padding: '6px 12px', opacity: dayOffset >= maxOff ? 0.3 : 1, cursor: dayOffset >= maxOff ? 'default' : 'pointer', fontSize: '16px' }}>→</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '12px', maxWidth: '1600px', margin: '0 auto' }}>
                {visibleDates.map(date => {
                  const ds = getDateStr(date), dow = date.getDay()
                  return <DayColumn key={ds} dateString={ds} date={date} isToday={ds === todayStr} isWeekend={dow === 0 || dow === 6} dayTasks={missionsByDate[ds] || []} {...dcp} />
                })}
              </div>
            </>
          )
        })())}

        {/* ── MISSIONS ── */}
        {view === 'missions' && (
          <MissionsView
            quests={quests}
            childrenByParent={childrenByParent}
            isMobile={mob}
            missionHandlers={missionHandlers}
            onAddMission={addTopMissionById}
          />
        )}

        {/* ── QUESTS ── */}
        {view === 'quests' && (
          <QuestsView
            quests={quests}
            childrenByParent={childrenByParent}
            selectedQuestId={selectedQuestId}
            onSelectQuest={setSelectedQuestId}
            questFilter={questFilter}
            setQuestFilter={setQuestFilter}
            isMobile={mob}
            onAddQuest={addQuest}
            onCompleteQuest={completeQuest}
            onReactivateQuest={reactivateQuest}
            onDeleteQuest={deleteItem}
            onAddTopMission={addTopMission}
            onRenameQuest={renameItem}
            missionHandlers={missionHandlers}
          />
        )}
      </div>

      {impData && <ImportModal data={impData} onApply={applyImport} onCancel={() => setImpData(null)} />}
      {editingMission && (
        <MissionEditModal
          mission={editingMission}
          onSave={updateMission}
          onClose={() => setEditingMission(null)}
        />
      )}
    </div>
  )
}
