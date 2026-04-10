const KEY = 'medivoice_patient_session'

/**
 * Demo patient auth — stored in localStorage only.
 * @returns {{ id: string, name: string, email: string } | null}
 */
export function getPatientSession() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (!p?.id || !p?.name?.trim()) return null
    return {
      id: String(p.id),
      name: String(p.name).trim(),
      email: String(p.email || '').trim(),
    }
  } catch {
    return null
  }
}

export function setPatientSession(session) {
  localStorage.setItem(
    KEY,
    JSON.stringify({
      id: session.id,
      name: session.name.trim(),
      email: (session.email || '').trim(),
    })
  )
}

export function clearPatientSession() {
  localStorage.removeItem(KEY)
}
