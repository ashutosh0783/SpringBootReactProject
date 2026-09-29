import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, incidentApi } from '../api/incidents.js'
import { openIncident } from '../test/fixtures.js'
import { renderPage } from '../test/utils.jsx'
import CreateIncidentPage from './CreateIncidentPage.jsx'

// vi.mock is hoisted above the imports, so the shared factory is loaded lazily
vi.mock('../api/incidents.js', async (importOriginal) => (await import('../test/utils.jsx')).mockApiModule(importOriginal))

const renderCreate = () => renderPage(<CreateIncidentPage />, { route: '/incidents/new', path: '/incidents/new' })

async function fillValidForm(user) {
  await user.type(screen.getByLabelText(/^incident number/i), 'INC-1001')
  await user.type(screen.getByLabelText(/^incident description/i), 'Payment service down')
}

describe('CreateIncidentPage', () => {
  it('creates the incident and opens its detail page', async () => {
    incidentApi.create.mockResolvedValue(openIncident)
    const { user } = renderCreate()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Incident' }))

    expect(incidentApi.create).toHaveBeenCalledWith(expect.objectContaining({
      incidentNumber: 'INC-1001',
      description: 'Payment service down',
      status: 'OPEN',
    }))
    expect(await screen.findByRole('heading', { name: 'Detail screen' })).toBeInTheDocument()
  })

  it('stays on the page and shows the server error for a duplicate number', async () => {
    incidentApi.create.mockRejectedValue(new ApiError(409, 'Incident INC-1001 already exists',
      { incidentNumber: 'Incident INC-1001 already exists' }))
    const { user } = renderCreate()

    await fillValidForm(user)
    await user.click(screen.getByRole('button', { name: 'Create Incident' }))

    expect(await screen.findAllByText('Incident INC-1001 already exists')).toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Create Incident' })).toBeInTheDocument()
  })

  it('goes back to the summary on Cancel', async () => {
    const { user } = renderCreate()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(await screen.findByRole('heading', { name: 'Summary screen' })).toBeInTheDocument()
    expect(incidentApi.create).not.toHaveBeenCalled()
  })
})
