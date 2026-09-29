import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { incidentApi } from './api/incidents.js'
import App from './App.jsx'

// vi.mock is hoisted above the imports, so the shared factory is loaded lazily
vi.mock('./api/incidents.js', async (importOriginal) => (await import('./test/utils.jsx')).mockApiModule(importOriginal))

const renderAt = (path) => render(<MemoryRouter initialEntries={[path]}><App /></MemoryRouter>)

describe('App routing', () => {
  beforeEach(() => {
    incidentApi.getSummary.mockResolvedValue([])
  })

  it.each([
    ['/', 'Incident Summary'],
    ['/incidents/new', 'Create Incident'],
    ['/delete', 'Delete Incident'],
  ])('%s shows the "%s" screen', async (path, heading) => {
    renderAt(path)

    expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeInTheDocument()
  })

  it('shows "Page not found" for unknown URLs', () => {
    renderAt('/nowhere')

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
  })

  it('navigates with the top menu and highlights the active item', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const nav = screen.getByRole('navigation')

    await user.click(screen.getByRole('link', { name: 'Delete Incident' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Delete Incident' })).toBeInTheDocument()
    expect(nav.querySelector('a.active')).toHaveTextContent('Delete Incident')
  })
})
