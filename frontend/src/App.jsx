import { NavLink, Route, Routes, Link } from 'react-router'
import SummaryPage from './pages/SummaryPage.jsx'
import CreateIncidentPage from './pages/CreateIncidentPage.jsx'
import IncidentDetailPage from './pages/IncidentDetailPage.jsx'
import DeleteIncidentPage from './pages/DeleteIncidentPage.jsx'

export default function App() {
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand">Incident Management</Link>
        <nav>
          <NavLink to="/" end>Summary</NavLink>
          <NavLink to="/incidents/new">Create Incident</NavLink>
          <NavLink to="/delete">Delete Incident</NavLink>
        </nav>
      </header>
      <main className="container">
        <Routes>
          <Route path="/" element={<SummaryPage />} />
          <Route path="/incidents/new" element={<CreateIncidentPage />} />
          <Route path="/incidents/:incidentNumber" element={<IncidentDetailPage />} />
          <Route path="/delete" element={<DeleteIncidentPage />} />
          <Route path="*" element={<div className="card"><h2>Page not found</h2><Link to="/">Back to summary</Link></div>} />
        </Routes>
      </main>
    </>
  )
}
