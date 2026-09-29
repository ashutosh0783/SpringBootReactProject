import { useState } from 'react'
import { STATUSES, todayIso } from '../api/incidents.js'

const EMPTY = {
  incidentNumber: '',
  status: 'OPEN',
  description: '',
  detailedAnalysis: '',
  createdDate: todayIso(),
  closedDate: '',
}

/** Client-side checks that mirror the server rules, for instant feedback. */
function validate(v, isCreate) {
  const e = {}
  if (isCreate) {
    if (!v.incidentNumber.trim()) e.incidentNumber = 'Incident number is required'
    else if (!/^[A-Za-z0-9_-]+$/.test(v.incidentNumber.trim()))
      e.incidentNumber = "Use only letters, digits, '-' and '_'"
  }
  if (!v.description.trim()) e.description = 'Description is required'
  if (!v.createdDate) e.createdDate = 'Date of creation is required'
  if (v.status === 'CLOSED') {
    if (!v.detailedAnalysis.trim()) e.detailedAnalysis = 'Detailed analysis is required to close an incident'
    if (v.closedDate && v.createdDate && v.closedDate < v.createdDate)
      e.closedDate = 'Date of close cannot be before the date of creation'
  }
  return e
}

/**
 * Shared form for create and edit.
 * onSubmit(payload) must return a promise; rejected ApiErrors with fieldErrors are shown inline.
 */
export default function IncidentForm({ initial, mode = 'create', submitLabel, onSubmit, onCancel }) {
  const isCreate = mode === 'create'
  const [values, setValues] = useState(() => ({
    ...EMPTY,
    ...Object.fromEntries(Object.entries(initial ?? {}).map(([k, v]) => [k, v ?? ''])),
  }))
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isClosed = values.status === 'CLOSED'

  function set(field, value) {
    setValues((v) => {
      const next = { ...v, [field]: value }
      // Closing: default close date to today. Re-opening: clear it.
      if (field === 'status') next.closedDate = value === 'CLOSED' ? v.closedDate || todayIso() : ''
      return next
    })
    setErrors((e) => ({ ...e, [field]: undefined }))
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    const clientErrors = validate(values, isCreate)
    setErrors(clientErrors)
    setFormError('')
    if (Object.keys(clientErrors).length) return

    const payload = {
      status: values.status,
      description: values.description.trim(),
      detailedAnalysis: values.detailedAnalysis.trim() || null,
      createdDate: values.createdDate,
      closedDate: isClosed ? values.closedDate || null : null,
    }
    if (isCreate) payload.incidentNumber = values.incidentNumber.trim()

    setSubmitting(true)
    try {
      await onSubmit(payload)
    } catch (err) {
      setErrors(err.fieldErrors ?? {})
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {formError && <div className="alert error">{formError}</div>}

      <div className="grid-2">
        <Field label="Incident number" error={errors.incidentNumber} required={isCreate}>
          <input
            value={values.incidentNumber}
            onChange={(e) => set('incidentNumber', e.target.value.toUpperCase())}
            placeholder="e.g. INC-1004"
            disabled={!isCreate}
            maxLength={50}
            autoFocus={isCreate}
          />
        </Field>

        <Field label="Incident status" error={errors.status} required>
          <select value={values.status} onChange={(e) => set('status', e.target.value)}>
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </Field>

        <Field label="Date of creation" error={errors.createdDate} required>
          <input type="date" value={values.createdDate} max={todayIso()}
                 onChange={(e) => set('createdDate', e.target.value)} />
        </Field>

        <Field label="Date of close" error={errors.closedDate}
               hint={isClosed ? 'Defaults to today if left empty' : 'Set status to Closed to enter a close date'}>
          <input type="date" value={values.closedDate} disabled={!isClosed} min={values.createdDate}
                 onChange={(e) => set('closedDate', e.target.value)} />
        </Field>
      </div>

      <Field label="Incident description" error={errors.description} required
             hint={`${values.description.length}/500 — short summary shown on the summary page`}>
        <textarea rows={3} maxLength={500} value={values.description}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="What happened?" />
      </Field>

      <Field label="Detailed analysis" error={errors.detailedAnalysis} required={isClosed}
             hint={isClosed ? 'Required when closing: root cause, fix and preventive action' : 'Investigation notes, root cause, fix…'}>
        <textarea rows={10} value={values.detailedAnalysis}
                  onChange={(e) => set('detailedAnalysis', e.target.value)}
                  placeholder="Timeline, root cause analysis, resolution steps, preventive actions…" />
      </Field>

      <div className="actions">
        {onCancel && <button type="button" className="btn" onClick={onCancel} disabled={submitting}>Cancel</button>}
        <button type="submit" className="btn primary" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

function Field({ label, error, hint, required, children }) {
  return (
    <label className={`field ${error ? 'has-error' : ''}`}>
      <span className="field-label">{label}{required && <span className="req"> *</span>}</span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
