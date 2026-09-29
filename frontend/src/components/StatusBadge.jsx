import { STATUSES } from '../api/incidents.js'

export function StatusBadge({ status }) {
  const label = STATUSES.find((s) => s.value === status)?.label ?? status
  return <span className={`badge status-${status.toLowerCase()}`}>{label}</span>
}

export function OpenClosedBadge({ open }) {
  return <span className={`badge ${open ? 'is-open' : 'is-closed'}`}>{open ? 'Open' : 'Closed'}</span>
}
