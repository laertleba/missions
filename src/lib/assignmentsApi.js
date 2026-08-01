import { supabase } from './supabase'

// Base URL of the missions-server NestJS API (e.g. a Railway/Render
// URL). Left unset until that service is deployed — every call below
// degrades gracefully (ineligible / empty list) rather than throwing,
// so the rest of the app works fine before the backend exists.
const API_URL = import.meta.env.VITE_ASSIGNMENTS_API_URL

async function authedFetch(path, options = {}) {
  if (!API_URL) return null
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const res = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.message || `Request failed (${res.status})`)
  return res.json()
}

export async function getEligibility() {
  try {
    const result = await authedFetch('/me/eligibility')
    return result || { eligible: false, domain: null }
  } catch {
    return { eligible: false, domain: null }
  }
}

export async function createAssignment({ assigneeEmail, title, description }) {
  return authedFetch('/assignments', {
    method: 'POST',
    body: JSON.stringify({ assigneeEmail, title, description }),
  })
}

export async function getMyAssignments() {
  try {
    return (await authedFetch('/assignments/mine')) || []
  } catch {
    return []
  }
}

export async function updateAssignmentStatus(id, status) {
  return authedFetch(`/assignments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}
