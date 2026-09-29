import { useNavigate, Link } from 'react-router'
import { incidentApi } from '../api/incidents.js'
import IncidentForm from '../components/IncidentForm.jsx'

export default function CreateIncidentPage() {
  const navigate = useNavigate()

  async function handleCreate(payload) {
    const created = await incidentApi.create(payload)
    navigate(`/incidents/${encodeURIComponent(created.incidentNumber)}`, {
      state: { flash: `Incident ${created.incidentNumber} created.` },
    })
  }

  return (
    <>
      <div className="page-head">
        <div>
          <Link to="/" className="back">← Back to summary</Link>
          <h1>Create Incident</h1>
          <p className="muted">Fields marked * are required. A closed incident needs a detailed analysis.</p>
        </div>
      </div>
      <div className="card">
        <IncidentForm mode="create" submitLabel="Create Incident" onSubmit={handleCreate}
                      onCancel={() => navigate('/')} />
      </div>
    </>
  )
}
