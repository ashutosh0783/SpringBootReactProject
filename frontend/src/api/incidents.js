const BASE = '/api/incidents'

export class ApiError extends Error {
  constructor(status, message, fieldErrors = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(BASE + path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the Spring Boot service running on port 8080?')
  }
  if (res.status === 204) return null
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(res.status, body?.detail || `Request failed (${res.status})`, body?.fieldErrors || {})
  }
  return body
}

const enc = encodeURIComponent

export const incidentApi = {
  getAll: () => request(''),
  getSummary: ({ search, status } = {}) => {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const qs = params.toString()
    return request('/summary' + (qs ? `?${qs}` : ''))
  },
  getDetails: (number) => request(`/${enc(number)}`),
  create: (data) => request('', { method: 'POST', body: JSON.stringify(data) }),
  update: (number, data) => request(`/${enc(number)}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (number) => request(`/${enc(number)}`, { method: 'DELETE' }),
}

export const STATUSES = [
  { value: 'OPEN', label: 'Open' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'RESOLVED', label: 'Resolved' },
  { value: 'CLOSED', label: 'Closed' },
]

/** Today's date as yyyy-mm-dd in the user's local time zone. */
export function todayIso() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
