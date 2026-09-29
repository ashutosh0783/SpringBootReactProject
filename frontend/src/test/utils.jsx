import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'

/**
 * Replacement for the api module: real helpers (STATUSES, dates, ApiError), mocked HTTP calls.
 * Use in a test file as:  vi.mock('../api/incidents.js', mockApiModule)
 */
export async function mockApiModule(importOriginal) {
  const actual = await importOriginal()
  return {
    ...actual,
    incidentApi: {
      getAll: vi.fn(),
      getSummary: vi.fn(),
      getDetails: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  }
}

/**
 * Render a page at `path` (matched by `route`). Other screens are stand-ins,
 * so a test can assert where the page navigated to.
 */
export function renderPage(element, { route = '/', path = '/' } = {}) {
  const user = userEvent.setup()
  const utils = render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={route} element={element} />
        {route !== '/' && <Route path="/" element={<h1>Summary screen</h1>} />}
        {route !== '/incidents/:incidentNumber' && (
          <Route path="/incidents/:incidentNumber" element={<h1>Detail screen</h1>} />
        )}
      </Routes>
    </MemoryRouter>,
  )
  return { user, ...utils }
}
