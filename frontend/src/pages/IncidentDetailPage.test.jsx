import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, incidentApi, todayIso } from '../api/incidents.js'
import { closedIncident, openIncident } from '../test/fixtures.js'
import { renderPage } from '../test/utils.jsx'
import IncidentDetailPage from './IncidentDetailPage.jsx'

// vi.mock is hoisted above the imports, so the shared factory is loaded lazily
vi.mock('../api/incidents.js', async (importOriginal) => (await import('../test/utils.jsx')).mockApiModule(importOriginal))

const renderDetail = (number = 'INC-1001') =>
  renderPage(<IncidentDetailPage />, { route: '/incidents/:incidentNumber', path: `/incidents/${number}` })

const button = (name) => screen.getByRole('button', { name })

describe('IncidentDetailPage', () => {
  beforeEach(() => {
    incidentApi.getDetails.mockResolvedValue(openIncident)
  })

  describe('viewing', () => {
    it('loads the incident from the number in the URL', async () => {
      renderDetail('INC-1001')

      expect(await screen.findByRole('heading', { name: 'INC-1001' })).toBeInTheDocument()
      expect(incidentApi.getDetails).toHaveBeenCalledWith('INC-1001')
      expect(screen.getByText(openIncident.description)).toBeInTheDocument()
      expect(screen.getByText(/no analysis recorded yet/i)).toBeInTheDocument()
    })

    it('offers Edit, Close and Delete for an open incident', async () => {
      renderDetail()
      await screen.findByRole('heading', { name: 'INC-1001' })

      expect(button('Edit / Update Analysis')).toBeInTheDocument()
      expect(button('Close Incident')).toBeInTheDocument()
      expect(button('Delete')).toBeInTheDocument()
    })

    it('shows the analysis and hides Close for a closed incident', async () => {
      incidentApi.getDetails.mockResolvedValue(closedIncident)
      renderDetail('INC-1003')

      expect(await screen.findByText(closedIncident.detailedAnalysis)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Close Incident' })).not.toBeInTheDocument()
    })

    it('shows an error with a way back for an unknown incident', async () => {
      incidentApi.getDetails.mockRejectedValue(new ApiError(404, 'Incident NOPE not found'))
      renderDetail('NOPE')

      expect(await screen.findByText('Incident NOPE not found')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /back to summary/i })).toHaveAttribute('href', '/')
    })

    it('shows a message passed from the create screen', async () => {
      render(
        <MemoryRouter initialEntries={[{ pathname: '/incidents/INC-1001', state: { flash: 'Incident INC-1001 created.' } }]}>
          <Routes><Route path="/incidents/:incidentNumber" element={<IncidentDetailPage />} /></Routes>
        </MemoryRouter>,
      )

      expect(await screen.findByText('Incident INC-1001 created.')).toBeInTheDocument()
    })
  })

  describe('editing', () => {
    it('saves changes with PUT and shows the updated incident', async () => {
      incidentApi.update.mockResolvedValue({ ...openIncident, detailedAnalysis: 'Gateway timeouts found' })
      const { user } = renderDetail()
      await user.click(await screen.findByRole('button', { name: 'Edit / Update Analysis' }))

      await user.type(screen.getByLabelText(/^detailed analysis/i), 'Gateway timeouts found')
      await user.click(button('Save Changes'))

      expect(incidentApi.update).toHaveBeenCalledWith('INC-1001', expect.objectContaining({
        detailedAnalysis: 'Gateway timeouts found',
        status: 'OPEN',
      }))
      expect(await screen.findByText('Incident updated.')).toBeInTheDocument()
      expect(screen.getByText('Gateway timeouts found')).toBeInTheDocument()
    })

    it('returns to the view on Cancel without saving', async () => {
      const { user } = renderDetail()
      await user.click(await screen.findByRole('button', { name: 'Edit / Update Analysis' }))

      await user.click(button('Cancel'))

      expect(button('Edit / Update Analysis')).toBeInTheDocument()
      expect(incidentApi.update).not.toHaveBeenCalled()
    })
  })

  describe('closing', () => {
    it('pre-selects Closed with today as the close date', async () => {
      const { user } = renderDetail()
      await user.click(await screen.findByRole('button', { name: 'Close Incident' }))

      expect(screen.getByRole('heading', { name: 'Close incident' })).toBeInTheDocument()
      expect(screen.getByLabelText(/^incident status/i)).toHaveValue('CLOSED')
      expect(screen.getByLabelText(/^date of close/i)).toHaveValue(todayIso())
    })

    it('will not close without a detailed analysis', async () => {
      const { user } = renderDetail()
      await user.click(await screen.findByRole('button', { name: 'Close Incident' }))

      await user.click(button('Close Incident'))

      expect(screen.getByText('Detailed analysis is required to close an incident')).toBeInTheDocument()
      expect(incidentApi.update).not.toHaveBeenCalled()
    })

    it('closes the incident with the analysis', async () => {
      incidentApi.update.mockResolvedValue({
        ...openIncident, status: 'CLOSED', open: false, detailedAnalysis: 'Expired certificate', closedDate: todayIso(),
      })
      const { user } = renderDetail()
      await user.click(await screen.findByRole('button', { name: 'Close Incident' }))

      await user.type(screen.getByLabelText(/^detailed analysis/i), 'Expired certificate')
      await user.click(button('Close Incident'))

      expect(incidentApi.update).toHaveBeenCalledWith('INC-1001', expect.objectContaining({
        status: 'CLOSED',
        detailedAnalysis: 'Expired certificate',
        closedDate: todayIso(),
      }))
      expect(await screen.findByText('Incident closed.')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Close Incident' })).not.toBeInTheDocument()
    })
  })

  describe('deleting', () => {
    it('asks for confirmation, deletes and returns to the summary', async () => {
      incidentApi.remove.mockResolvedValue(null)
      const { user } = renderDetail()
      await user.click(await screen.findByRole('button', { name: 'Delete' }))

      expect(screen.getByText('Delete incident INC-1001?')).toBeInTheDocument()
      expect(incidentApi.remove).not.toHaveBeenCalled()

      await user.click(button('Yes, delete'))

      expect(incidentApi.remove).toHaveBeenCalledWith('INC-1001')
      expect(await screen.findByRole('heading', { name: 'Summary screen' })).toBeInTheDocument()
    })

    it('does nothing when the deletion is cancelled', async () => {
      const { user } = renderDetail()
      await user.click(await screen.findByRole('button', { name: 'Delete' }))

      await user.click(button('Cancel'))

      expect(screen.queryByText('Delete incident INC-1001?')).not.toBeInTheDocument()
      expect(incidentApi.remove).not.toHaveBeenCalled()
    })

    it('shows the error and stays on the page if the delete fails', async () => {
      incidentApi.remove.mockRejectedValue(new ApiError(404, 'Incident INC-1001 not found'))
      const user = userEvent.setup()
      renderDetail()
      await user.click(await screen.findByRole('button', { name: 'Delete' }))

      await user.click(button('Yes, delete'))

      expect(await screen.findByText('Incident INC-1001 not found')).toBeInTheDocument()
      expect(button('Yes, delete')).toBeEnabled()
    })
  })
})
