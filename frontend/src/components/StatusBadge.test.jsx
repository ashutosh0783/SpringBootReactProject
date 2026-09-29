import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OpenClosedBadge, StatusBadge } from './StatusBadge.jsx'

describe('StatusBadge', () => {
  it.each([
    ['OPEN', 'Open', 'status-open'],
    ['IN_PROGRESS', 'In Progress', 'status-in_progress'],
    ['RESOLVED', 'Resolved', 'status-resolved'],
    ['CLOSED', 'Closed', 'status-closed'],
  ])('%s shows "%s" with class %s', (status, label, className) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toHaveClass('badge', className)
  })

  it('falls back to the raw value for an unknown status', () => {
    render(<StatusBadge status="ON_HOLD" />)
    expect(screen.getByText('ON_HOLD')).toBeInTheDocument()
  })
})

describe('OpenClosedBadge', () => {
  it('shows Open for open incidents', () => {
    render(<OpenClosedBadge open />)
    expect(screen.getByText('Open')).toHaveClass('is-open')
  })

  it('shows Closed for closed incidents', () => {
    render(<OpenClosedBadge open={false} />)
    expect(screen.getByText('Closed')).toHaveClass('is-closed')
  })
})
