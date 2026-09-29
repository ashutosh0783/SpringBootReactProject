// Sample API responses shared by the tests

export const openIncident = {
  id: 1,
  incidentNumber: 'INC-1001',
  status: 'OPEN',
  open: true,
  description: 'Payment service returning HTTP 500',
  detailedAnalysis: null,
  createdDate: '2026-09-20',
  closedDate: null,
  createdAt: '2026-09-20T10:00:00',
  updatedAt: '2026-09-20T10:00:00',
}

export const closedIncident = {
  id: 3,
  incidentNumber: 'INC-1003',
  status: 'CLOSED',
  open: false,
  description: 'Nightly report job failed',
  detailedAnalysis: 'Root cause: disk full.',
  createdDate: '2026-09-15',
  closedDate: '2026-09-16',
  createdAt: '2026-09-15T10:00:00',
  updatedAt: '2026-09-16T10:00:00',
}

export const toSummary = ({ incidentNumber, description, status, open, createdDate, closedDate }) =>
  ({ incidentNumber, description, status, open, createdDate, closedDate })
