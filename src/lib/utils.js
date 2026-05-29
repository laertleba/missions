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
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')
}

// Supabase row → local task object
export function rowToTask(row) {
  return {
    id: row.id,
    text: row.title,
    duration: row.duration,
    startTime: row.start_time,
    endTime: row.end_time,
    completed: row.completed,
    position: row.position,
  }
}

// Local task → Supabase insert/update payload
export function taskToRow(task, dateStr, userId) {
  return {
    id: task.id,
    user_id: userId,
    date_str: dateStr,
    title: task.text,
    duration: task.duration,
    start_time: task.startTime,
    end_time: task.endTime,
    completed: task.completed,
    position: task.position ?? 0,
  }
}

// Array of Supabase rows → { dateStr: Task[] }
export function rowsToMap(rows) {
  const map = {}
  for (const row of rows) {
    if (!map[row.date_str]) map[row.date_str] = []
    map[row.date_str].push(rowToTask(row))
  }
  for (const arr of Object.values(map)) {
    arr.sort((a, b) => a.position - b.position)
  }
  return map
}
