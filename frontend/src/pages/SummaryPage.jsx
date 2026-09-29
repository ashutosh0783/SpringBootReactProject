import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { incidentApi, STATUSES, formatDate } from '../api/incidents.js'
import { StatusBadge, OpenClosedBadge } from '../components/StatusBadge.jsx'

export default function SummaryPage() {
  const navigate = useNavigate()
  const [incidents, setIncidents] = useState([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Debounced search: query the server 300 ms after the user stops typing
  useEffect(() => {
    let cancelled = false
    const t = setTimeout(async () => {
      setLoading(true)
      try {
        const data = await incidentApi.getSummary({ search: search.trim(), status })
        if (!cancelled) { setIncidents(data); setError('') }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(t) }
  }, [search, status])

  const openCount = incidents.filter((i) => i.open).length

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Incident Summary</h1>
          <p className="muted">Click an incident to view details, update the analysis, or close it.</p>
        </div>
        <Link to="/incidents/new" className="btn primary">+ Create Incident</Link>
      </div>

      <div className="stats">
        <div className="stat"><span>{incidents.length}</span>Shown</div>
        <div className="stat open"><span>{openCount}</span>Open</div>
        <div className="stat closed"><span>{incidents.length - openCount}</span>Closed</div>
      </div>

      <div className="toolbar">
        <input
          type="search"
          className="search"
          placeholder="Search by incident number or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="card table-card">
        <table className="table">
          <thead>
            <tr>
              <th>Incident #</th>
              <th>Description</th>
              <th>Status</th>
              <th>Open / Closed</th>
              <th>Created</th>
              <th>Closed</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((i) => (
              <tr key={i.incidentNumber} className="clickable"
                  onClick={() => navigate(`/incidents/${encodeURIComponent(i.incidentNumber)}`)}>
                <td data-label="Incident #">
                  <Link to={`/incidents/${encodeURIComponent(i.incidentNumber)}`} onClick={(e) => e.stopPropagation()}>
                    {i.incidentNumber}
                  </Link>
                </td>
                <td data-label="Description" className="desc">{i.description}</td>
                <td data-label="Status"><StatusBadge status={i.status} /></td>
                <td data-label="Open / Closed"><OpenClosedBadge open={i.open} /></td>
                <td data-label="Created">{formatDate(i.createdDate)}</td>
                <td data-label="Closed">{formatDate(i.closedDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !error && incidents.length === 0 && (
          <div className="empty">
            {search || status ? 'No incidents match your search.' : 'No incidents yet.'}{' '}
            <Link to="/incidents/new">Create one</Link>
          </div>
        )}
        {loading && incidents.length === 0 && <div className="empty">Loading…</div>}
      </div>
    </>
  )
}
