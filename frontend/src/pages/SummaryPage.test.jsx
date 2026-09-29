import { screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, incidentApi } from '../api/incidents.js'
import { closedIncident, openIncident, toSummary } from '../test/fixtures.js'
import { renderPage } from '../test/utils.jsx'
import SummaryPage from './SummaryPage.jsx'

// vi.mock is hoisted above the imports, so the shared factory is loaded lazily
vi.mock('../api/incidents.js', async (importOriginal) => (await import('../test/utils.jsx')).mockApiModule(importOriginal))

const rows = [toSummary(openIncident), toSummary(closedIncident)]
const stat = (label) => screen.getByText(label, { selector: '.stat' })

describe('SummaryPage', () => {
  beforeEach(() => {
    incidentApi.getSummary.mockResolvedValue(rows)
  })

  it('loads and lists incidents with status and open/closed badges', async () => {
    renderPage(<SummaryPage />)

    const openRow = (await screen.findByText('INC-1001')).closest('tr')
    expect(within(openRow).getByText(openIncident.description)).toBeInTheDocument()
    expect(within(openRow).getAllByText('Open')).toHaveLength(2) // status + open/closed badge

    const closedRow = screen.getByText('INC-1003').closest('tr')
    expect(within(closedRow).getAllByText('Closed')).toHaveLength(2)

    expect(incidentApi.getSummary).toHaveBeenCalledWith({ search: '', status: '' })
  })

  it('shows shown/open/closed counts', async () => {
    renderPage(<SummaryPage />)
    await screen.findByText('INC-1001')

    expect(stat('Shown')).toHaveTextContent('2')
    expect(stat('Open')).toHaveTextContent('1')
    expect(stat('Closed')).toHaveTextContent('1')
  })

  it('searches the server with the trimmed text', async () => {
    const { user } = renderPage(<SummaryPage />)
    await screen.findByText('INC-1001')
    incidentApi.getSummary.mockResolvedValue([toSummary(openIncident)])

    await user.type(screen.getByPlaceholderText(/search by incident number/i), '  payment ')

    await waitFor(() =>
      expect(incidentApi.getSummary).toHaveBeenLastCalledWith({ search: 'payment', status: '' }))
    await waitFor(() => expect(screen.queryByText('INC-1003')).not.toBeInTheDocument())
  })

  it('debounces typing into a single request', async () => {
    const { user } = renderPage(<SummaryPage />)
    await screen.findByText('INC-1001')
    incidentApi.getSummary.mockClear()

    await user.type(screen.getByPlaceholderText(/search by incident number/i), 'disk')

    await waitFor(() => expect(incidentApi.getSummary).toHaveBeenCalled())
    expect(incidentApi.getSummary).toHaveBeenCalledOnce()
  })

  it('filters by status', async () => {
    const { user } = renderPage(<SummaryPage />)
    await screen.findByText('INC-1001')

    await user.selectOptions(screen.getByLabelText('Filter by status'), 'CLOSED')

    await waitFor(() =>
      expect(incidentApi.getSummary).toHaveBeenLastCalledWith({ search: '', status: 'CLOSED' }))
  })

  it('opens the detail page when a row is clicked', async () => {
    const { user } = renderPage(<SummaryPage />)

    await user.click(await screen.findByText(closedIncident.description))

    expect(await screen.findByRole('heading', { name: 'Detail screen' })).toBeInTheDocument()
  })

  it('shows an empty state when there are no incidents', async () => {
    incidentApi.getSummary.mockResolvedValue([])
    renderPage(<SummaryPage />)

    expect(await screen.findByText(/no incidents yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create one' })).toHaveAttribute('href', '/incidents/new')
  })

  it('shows a "no match" message when a search finds nothing', async () => {
    const { user } = renderPage(<SummaryPage />)
    await screen.findByText('INC-1001')
    incidentApi.getSummary.mockResolvedValue([])

    await user.type(screen.getByPlaceholderText(/search by incident number/i), 'zzz')

    expect(await screen.findByText(/no incidents match your search/i)).toBeInTheDocument()
  })

  it('shows the error when the server cannot be reached', async () => {
    incidentApi.getSummary.mockRejectedValue(new ApiError(0, 'Cannot reach the server.'))
    renderPage(<SummaryPage />)

    expect(await screen.findByText('Cannot reach the server.')).toBeInTheDocument()
  })

  it('links to the create screen', () => {
    renderPage(<SummaryPage />)

    expect(screen.getByRole('link', { name: '+ Create Incident' })).toHaveAttribute('href', '/incidents/new')
  })
})
