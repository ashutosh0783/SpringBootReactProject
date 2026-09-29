import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { incidentApi, formatDate, todayIso } from '../api/incidents.js'
import { StatusBadge, OpenClosedBadge } from '../components/StatusBadge.jsx'
import IncidentForm from '../components/IncidentForm.jsx'

export default function IncidentDetailPage() {
  const { incidentNumber } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [incident, setIncident] = useState(null)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('view') // view | edit | close | delete
  const [flash, setFlash] = useState(location.state?.flash ?? '')

  useEffect(() => {
    let cancelled = false
    setIncident(null)
    setError('')
    incidentApi.getDetails(incidentNumber)
      .then((data) => { if (!cancelled) setIncident(data) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [incidentNumber])

  function saved(updated, message) {
    setIncident(updated)
    setMode('view')
    setFlash(message)
  }

  async function handleUpdate(payload) {
    saved(await incidentApi.update(incident.incidentNumber, payload), 'Incident updated.')
  }

  async function handleClose(payload) {
    saved(await incidentApi.update(incident.incidentNumber, payload), 'Incident closed.')
  }

  async function handleDelete() {
    await incidentApi.remove(incident.incidentNumber)
    navigate('/', { replace: true })
  }

  if (error) {
    return (
      <div className="card">
        <div className="alert error">{error}</div>
        <Link to="/">← Back to summary</Link>
      </div>
    )
  }
  if (!incident) return <div className="empty">Loading…</div>

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/" className="back">← Back to summary</Link>
          <h1>{incident.incidentNumber}</h1>
          <div className="badges">
            <StatusBadge status={incident.status} />
            <OpenClosedBadge open={incident.open} />
          </div>
        </div>
        {mode === 'view' && (
          <div className="actions">
            <button className="btn" onClick={() => { setFlash(''); setMode('edit') }}>Edit / Update Analysis</button>
            {incident.open && (
              <button className="btn success" onClick={() => { setFlash(''); setMode('close') }}>Close Incident</button>
            )}
            <button className="btn danger" onClick={() => { setFlash(''); setMode('delete') }}>Delete</button>
          </div>
        )}
      </div>

      {flash && <div className="alert success">{flash}</div>}

      {mode === 'delete' && (
        <DeleteConfirm number={incident.incidentNumber} onConfirm={handleDelete} onCancel={() => setMode('view')} />
      )}

      {mode === 'edit' && (
        <div className="card">
          <h2>Update incident</h2>
          <IncidentForm mode="edit" initial={incident} submitLabel="Save Changes"
                        onSubmit={handleUpdate} onCancel={() => setMode('view')} />
        </div>
      )}

      {mode === 'close' && (
        <div className="card">
          <h2>Close incident</h2>
          <p className="muted">Confirm the close date and write the final detailed analysis (root cause, fix, preventive action).</p>
          <IncidentForm mode="edit" submitLabel="Close Incident"
                        initial={{ ...incident, status: 'CLOSED', closedDate: todayIso() }}
                        onSubmit={handleClose} onCancel={() => setMode('view')} />
        </div>
      )}

      {(mode === 'view' || mode === 'delete') && (
        <div className="card">
          <dl className="details">
            <div><dt>Incident number</dt><dd>{incident.incidentNumber}</dd></div>
            <div><dt>Status</dt><dd><StatusBadge status={incident.status} /></dd></div>
            <div><dt>Date of creation</dt><dd>{formatDate(incident.createdDate)}</dd></div>
            <div><dt>Date of close</dt><dd>{formatDate(incident.closedDate)}</dd></div>
          </dl>
          <section>
            <h3>Description</h3>
            <p className="prewrap">{incident.description}</p>
          </section>
          <section>
            <h3>Detailed analysis</h3>
            {incident.detailedAnalysis
              ? <p className="prewrap analysis">{incident.detailedAnalysis}</p>
              : <p className="muted">No analysis recorded yet. Use “Edit / Update Analysis” to add one.</p>}
          </section>
          {incident.updatedAt && (
            <p className="muted small">Last updated {new Date(incident.updatedAt).toLocaleString()}</p>
          )}
        </div>
      )}
    </>
  )
}

export function DeleteConfirm({ number, onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await onConfirm()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="alert danger-box">
      <strong>Delete incident {number}?</strong> This permanently removes it and its analysis. This cannot be undone.
      {error && <div className="field-error">{error}</div>}
      <div className="actions">
        <button className="btn" onClick={onCancel} disabled={busy}>Cancel</button>
        <button className="btn danger" onClick={confirm} disabled={busy}>{busy ? 'Deleting…' : 'Yes, delete'}</button>
      </div>
    </div>
  )
}
