import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { todayIso } from '../api/incidents.js'
import { openIncident } from '../test/fixtures.js'
import IncidentForm from './IncidentForm.jsx'

const field = {
  number: () => screen.getByLabelText(/^incident number/i),
  status: () => screen.getByLabelText(/^incident status/i),
  created: () => screen.getByLabelText(/^date of creation/i),
  closed: () => screen.getByLabelText(/^date of close/i),
  description: () => screen.getByLabelText(/^incident description/i),
  analysis: () => screen.getByLabelText(/^detailed analysis/i),
}

function renderForm(props = {}) {
  const onSubmit = props.onSubmit ?? vi.fn().mockResolvedValue(undefined)
  const user = userEvent.setup()
  render(<IncidentForm mode="create" submitLabel="Create Incident" {...props} onSubmit={onSubmit} />)
  const submit = () => user.click(screen.getByRole('button', { name: props.submitLabel ?? 'Create Incident' }))
  return { user, onSubmit, submit }
}

describe('IncidentForm in create mode', () => {
  it('starts with status Open, today as creation date and no close date', () => {
    renderForm()

    expect(field.number()).toHaveValue('')
    expect(field.number()).toBeEnabled()
    expect(field.status()).toHaveValue('OPEN')
    expect(field.created()).toHaveValue(todayIso())
    expect(field.closed()).toHaveValue('')
    expect(field.closed()).toBeDisabled()
  })

  it('shows required-field errors and does not submit an empty form', async () => {
    const { submit, onSubmit } = renderForm()

    await submit()

    expect(screen.getByText('Incident number is required')).toBeInTheDocument()
    expect(screen.getByText('Description is required')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects incident numbers with invalid characters', async () => {
    const { user, submit, onSubmit } = renderForm()

    await user.type(field.number(), 'INC 1!')
    await user.type(field.description(), 'Something broke')
    await submit()

    expect(screen.getByText("Use only letters, digits, '-' and '_'")).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('upper-cases the incident number while typing', async () => {
    const { user } = renderForm()

    await user.type(field.number(), 'inc-42')

    expect(field.number()).toHaveValue('INC-42')
  })

  it('clears a field error as soon as the field is edited', async () => {
    const { user, submit } = renderForm()
    await submit()
    expect(screen.getByText('Description is required')).toBeInTheDocument()

    await user.type(field.description(), 'x')

    expect(screen.queryByText('Description is required')).not.toBeInTheDocument()
  })

  it('submits a trimmed payload with null close date and analysis for an open incident', async () => {
    const { user, submit, onSubmit } = renderForm()

    await user.type(field.number(), '  inc-7  ')
    await user.type(field.description(), '  Checkout failing  ')
    await user.type(field.analysis(), '   ')
    await submit()

    expect(onSubmit).toHaveBeenCalledWith({
      incidentNumber: 'INC-7',
      status: 'OPEN',
      description: 'Checkout failing',
      detailedAnalysis: null,
      createdDate: todayIso(),
      closedDate: null,
    })
  })

  describe('closing', () => {
    it('enables the close date and fills in today when status becomes Closed', async () => {
      const { user } = renderForm()

      await user.selectOptions(field.status(), 'CLOSED')

      expect(field.closed()).toBeEnabled()
      expect(field.closed()).toHaveValue(todayIso())
      expect(screen.getByText(/required when closing/i)).toBeInTheDocument()
    })

    it('clears and disables the close date when re-opened', async () => {
      const { user } = renderForm()

      await user.selectOptions(field.status(), 'CLOSED')
      await user.selectOptions(field.status(), 'IN_PROGRESS')

      expect(field.closed()).toHaveValue('')
      expect(field.closed()).toBeDisabled()
    })

    it('requires a detailed analysis', async () => {
      const { user, submit, onSubmit } = renderForm()

      await user.type(field.number(), 'INC-7')
      await user.type(field.description(), 'Checkout failing')
      await user.selectOptions(field.status(), 'CLOSED')
      await submit()

      expect(screen.getByText('Detailed analysis is required to close an incident')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('rejects a close date before the creation date', async () => {
      const { user, submit, onSubmit } = renderForm()

      await user.type(field.number(), 'INC-7')
      await user.type(field.description(), 'Checkout failing')
      await user.type(field.analysis(), 'Root cause')
      fireEvent.change(field.created(), { target: { value: '2026-09-20' } })
      await user.selectOptions(field.status(), 'CLOSED')
      fireEvent.change(field.closed(), { target: { value: '2026-09-19' } })
      await submit()

      expect(screen.getByText('Date of close cannot be before the date of creation')).toBeInTheDocument()
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('submits status, analysis and close date', async () => {
      const { user, submit, onSubmit } = renderForm()

      await user.type(field.number(), 'INC-7')
      await user.type(field.description(), 'Checkout failing')
      await user.type(field.analysis(), 'Root cause: expired cert')
      fireEvent.change(field.created(), { target: { value: '2026-09-20' } })
      await user.selectOptions(field.status(), 'CLOSED')
      fireEvent.change(field.closed(), { target: { value: '2026-09-21' } })
      await submit()

      expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
        status: 'CLOSED',
        detailedAnalysis: 'Root cause: expired cert',
        createdDate: '2026-09-20',
        closedDate: '2026-09-21',
      }))
    })
  })

  it('shows server-side errors next to fields and at the top', async () => {
    const onSubmit = vi.fn().mockRejectedValue(Object.assign(new Error('Incident INC-7 already exists'), {
      fieldErrors: { incidentNumber: 'Incident INC-7 already exists' },
    }))
    const { user, submit } = renderForm({ onSubmit })

    await user.type(field.number(), 'INC-7')
    await user.type(field.description(), 'Checkout failing')
    await submit()

    expect(await screen.findAllByText('Incident INC-7 already exists')).toHaveLength(2)
    expect(screen.getByRole('button', { name: 'Create Incident' })).toBeEnabled()
  })

  it('disables the buttons and shows "Saving…" while submitting', async () => {
    let finish
    const onSubmit = vi.fn(() => new Promise((resolve) => { finish = resolve }))
    const { user, submit } = renderForm({ onSubmit, onCancel: vi.fn() })

    await user.type(field.number(), 'INC-7')
    await user.type(field.description(), 'Checkout failing')
    await submit()

    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    finish()
    expect(await screen.findByRole('button', { name: 'Create Incident' })).toBeEnabled()
  })

  it('calls onCancel', async () => {
    const onCancel = vi.fn()
    const { user } = renderForm({ onCancel })

    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalledOnce()
  })
})

describe('IncidentForm in edit mode', () => {
  it('pre-fills values, locks the incident number and omits it from the payload', async () => {
    const { user, submit, onSubmit } = renderForm({ mode: 'edit', initial: openIncident, submitLabel: 'Save Changes' })

    expect(field.number()).toHaveValue('INC-1001')
    expect(field.number()).toBeDisabled()
    expect(field.description()).toHaveValue(openIncident.description)
    expect(field.analysis()).toHaveValue('') // null from the API becomes an empty field
    expect(field.created()).toHaveValue('2026-09-20')

    await user.type(field.analysis(), 'Investigating')
    await submit()

    const payload = onSubmit.mock.calls[0][0]
    expect(payload).not.toHaveProperty('incidentNumber')
    expect(payload).toEqual({
      status: 'OPEN',
      description: openIncident.description,
      detailedAnalysis: 'Investigating',
      createdDate: '2026-09-20',
      closedDate: null,
    })
  })
})
