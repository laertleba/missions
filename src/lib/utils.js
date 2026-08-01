export function getDateStr(d) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  )
}

export function fmtTime(m) {
  if (m == null) return ''
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
}

// ── Supabase row → client item ──────────────────────────────
// Client item carries both canonical fields and Weekly-compat aliases
// (text/duration) so the existing TaskCard/DayColumn work unchanged.
export function rowToItem(row) {
  const start = row.start_time
  const end = row.end_time
  return {
    id: row.id,
    type: row.type,
    title: row.title || '',
    text: row.title || '', // alias for TaskCard
    completed: row.completed,
    completedAt: row.completed_at,
    archived: row.archived,
    questId: row.quest_id,
    parentId: row.parent_id,
    scheduledDate: row.scheduled_date, // 'YYYY-MM-DD' | null
    startTime: start, // minutes | null
    endTime: end,
    duration: start != null && end != null ? end - start : 30,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    starred: !!row.starred,
    notes: row.notes || '',
    description: row.description || '',
  }
}

// ── Collect a mission + its whole descendant subtree (ids) ──
export function collectSubtreeIds(items, rootId) {
  const byParent = {}
  for (const it of items) {
    if (it.parentId) (byParent[it.parentId] ||= []).push(it.id)
  }
  const out = []
  const stack = [rootId]
  while (stack.length) {
    const id = stack.pop()
    out.push(id)
    for (const child of byParent[id] || []) stack.push(child)
  }
  return out
}

// ── Compute depth of each item by walking parent chain ──────
// Used by Import to insert parents before children (FK ordering).
export function computeDepth(item, byId, cache = {}) {
  if (cache[item.id] != null) return cache[item.id]
  if (!item.parent_id) return (cache[item.id] = 0)
  const parent = byId[item.parent_id]
  if (!parent) return (cache[item.id] = 1)
  return (cache[item.id] = computeDepth(parent, byId, cache) + 1)
}
