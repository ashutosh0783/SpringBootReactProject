import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, incidentApi } from '../api/incidents.js'
import { openIncident } from '../test/fixtures.js'
import { renderPage } from '../test/utils.jsx'
import DeleteIncidentPage from './DeleteIncidentPage.jsx'

// vi.mock is hoisted above the imports, so the shared factory is loaded lazily
vi.mock('../api/incidents.js', async (importOriginal) => (await import('../test/utils.jsx')).mockApiModule(importOriginal))

const renderDelete = () => renderPage(<DeleteIncidentPage />, { route: '/delete', path: '/delete' })
const numberInput = () => screen.getByPlaceholderText(/incident number/i)
const findButton = () => screen.getByRole('button', { name: 'Find Incident' })

async function lookUp(user, number) {
  await user.type(numberInput(), number)
  await user.click(findButton())
}

describe('DeleteIncidentPage', () => {
  it('asks for a number before searching', async () => {
    const { user } = renderDelete()

    await user.click(findButton())

    expect(screen.getByText('Enter an incident number')).toBeInTheDocument()
    expect(incidentApi.getDetails).not.toHaveBeenCalled()
  })

  it('looks up the incident (upper-cased) and shows it for review', async () => {
    incidentApi.getDetails.mockResolvedValue(openIncident)
    const { user } = renderDelete()

    await lookUp(user, 'inc-1001')

    expect(incidentApi.getDetails).toHaveBeenCalledWith('INC-1001')
    expect(await screen.findByText(openIncident.description)).toBeInTheDocument()
    expect(screen.getByText('Delete incident INC-1001?')).toBeInTheDocument()
  })

  it('shows an error when the incident does not exist', async () => {
    incidentApi.getDetails.mockRejectedValue(new ApiError(404, 'Incident NOPE not found'))
    const { user } = renderDelete()

    await lookUp(user, 'NOPE')

    expect(await screen.findByText('Incident NOPE not found')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Yes, delete' })).not.toBeInTheDocument()
  })

  it('deletes after confirmation and resets the form', async () => {
    incidentApi.getDetails.mockResolvedValue(openIncident)
    incidentApi.remove.mockResolvedValue(null)
    const { user } = renderDelete()
    await lookUp(user, 'INC-1001')

    await user.click(await screen.findByRole('button', { name: 'Yes, delete' }))

    expect(incidentApi.remove).toHaveBeenCalledWith('INC-1001')
    expect(await screen.findByText('Incident INC-1001 was deleted.')).toBeInTheDocument()
    expect(numberInput()).toHaveValue('')
    expect(screen.queryByText(openIncident.description)).not.toBeInTheDocument()
  })

  it('hides the incident when the deletion is cancelled', async () => {
    incidentApi.getDetails.mockResolvedValue(openIncident)
    const { user } = renderDelete()
    await lookUp(user, 'INC-1001')

    await user.click(await screen.findByRole('button', { name: 'Cancel' }))

    expect(screen.queryByText('Delete incident INC-1001?')).not.toBeInTheDocument()
    expect(incidentApi.remove).not.toHaveBeenCalled()
  })

  it('shows the error when the delete fails', async () => {
    incidentApi.getDetails.mockResolvedValue(openIncident)
    incidentApi.remove.mockRejectedValue(new ApiError(0, 'Cannot reach the server.'))
    const { user } = renderDelete()
    await lookUp(user, 'INC-1001')

    await user.click(await screen.findByRole('button', { name: 'Yes, delete' }))

    expect(await screen.findByText('Cannot reach the server.')).toBeInTheDocument()
    expect(screen.queryByText(/was deleted/)).not.toBeInTheDocument()
  })
})
