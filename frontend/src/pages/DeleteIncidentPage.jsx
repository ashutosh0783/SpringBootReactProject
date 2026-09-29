import { useState } from 'react'
import { Link } from 'react-router'
import { incidentApi, formatDate } from '../api/incidents.js'
import { StatusBadge, OpenClosedBadge } from '../components/StatusBadge.jsx'
import { DeleteConfirm } from './IncidentDetailPage.jsx'

/** Look up an incident by number, review it, then delete it. */
export default function DeleteIncidentPage() {
  const [number, setNumber] = useState('')
  const [incident, setIncident] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function lookup(e) {
    e.preventDefault()
    const n = number.trim()
    if (!n) { setError('Enter an incident number'); return }
    setLoading(true)
    setError('')
    setMessage('')
    setIncident(null)
    try {
      setIncident(await incidentApi.getDetails(n))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    await incidentApi.remove(incident.incidentNumber)
    setMessage(`Incident ${incident.incidentNumber} was deleted.`)
    setIncident(null)
    setNumber('')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/" className="back">← Back to summary</Link>
          <h1>Delete Incident</h1>
          <p className="muted">Enter an incident number, review it, then confirm the deletion.</p>
        </div>
      </div>

      <div className="card">
        <form className="toolbar" onSubmit={lookup}>
          <input className="search" placeholder="Incident number, e.g. INC-1001" value={number}
                 onChange={(e) => setNumber(e.target.value.toUpperCase())} autoFocus />
          <button className="btn primary" disabled={loading}>{loading ? 'Searching…' : 'Find Incident'}</button>
        </form>
        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        {incident && (
          <>
            <dl className="details">
              <div><dt>Incident number</dt><dd>{incident.incidentNumber}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge status={incident.status} /> <OpenClosedBadge open={incident.open} /></dd></div>
              <div><dt>Date of creation</dt><dd>{formatDate(incident.createdDate)}</dd></div>
              <div><dt>Date of close</dt><dd>{formatDate(incident.closedDate)}</dd></div>
            </dl>
            <p className="prewrap">{incident.description}</p>
            <DeleteConfirm number={incident.incidentNumber} onConfirm={handleDelete}
                           onCancel={() => setIncident(null)} />
          </>
        )}
      </div>
    </>
  )
}
