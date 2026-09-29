import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, formatDate, incidentApi, todayIso } from './incidents.js'

function respond(status, body) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => (body === undefined ? Promise.reject(new Error('no body')) : Promise.resolve(body)),
  })
}

describe('incidentApi', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => vi.unstubAllGlobals())

  const lastCall = () => fetchMock.mock.calls.at(-1)

  it('getAll calls GET /api/incidents', async () => {
    fetchMock.mockReturnValue(respond(200, [{ incidentNumber: 'INC-1' }]))

    await expect(incidentApi.getAll()).resolves.toEqual([{ incidentNumber: 'INC-1' }])
    expect(lastCall()[0]).toBe('/api/incidents')
  })

  it('getSummary without filters has no query string', async () => {
    fetchMock.mockReturnValue(respond(200, []))

    await incidentApi.getSummary()
    expect(lastCall()[0]).toBe('/api/incidents/summary')
  })

  it('getSummary sends search and status as encoded query params', async () => {
    fetchMock.mockReturnValue(respond(200, []))

    await incidentApi.getSummary({ search: 'disk & cpu', status: 'CLOSED' })
    expect(lastCall()[0]).toBe('/api/incidents/summary?search=disk+%26+cpu&status=CLOSED')
  })

  it('getDetails URL-encodes the incident number', async () => {
    fetchMock.mockReturnValue(respond(200, {}))

    await incidentApi.getDetails('INC/1')
    expect(lastCall()[0]).toBe('/api/incidents/INC%2F1')
  })

  it('create POSTs JSON', async () => {
    fetchMock.mockReturnValue(respond(201, { incidentNumber: 'INC-9' }))

    await incidentApi.create({ incidentNumber: 'INC-9' })
    const [url, options] = lastCall()
    expect(url).toBe('/api/incidents')
    expect(options.method).toBe('POST')
    expect(options.headers['Content-Type']).toBe('application/json')
    expect(JSON.parse(options.body)).toEqual({ incidentNumber: 'INC-9' })
  })

  it('update PUTs JSON to the incident URL', async () => {
    fetchMock.mockReturnValue(respond(200, {}))

    await incidentApi.update('INC-9', { status: 'CLOSED' })
    const [url, options] = lastCall()
    expect(url).toBe('/api/incidents/INC-9')
    expect(options.method).toBe('PUT')
    expect(JSON.parse(options.body)).toEqual({ status: 'CLOSED' })
  })

  it('remove sends DELETE and returns null for 204', async () => {
    fetchMock.mockReturnValue(respond(204))

    await expect(incidentApi.remove('INC-9')).resolves.toBeNull()
    expect(lastCall()[1].method).toBe('DELETE')
  })

  it('throws ApiError with server detail and fieldErrors', async () => {
    fetchMock.mockReturnValue(respond(400, {
      detail: 'One or more fields are invalid',
      fieldErrors: { description: 'Description is required' },
    }))

    const err = await incidentApi.create({}).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(400)
    expect(err.message).toBe('One or more fields are invalid')
    expect(err.fieldErrors).toEqual({ description: 'Description is required' })
  })

  it('throws a generic ApiError when the error has no JSON body', async () => {
    fetchMock.mockReturnValue(respond(500))

    const err = await incidentApi.getAll().catch((e) => e)
    expect(err.status).toBe(500)
    expect(err.message).toBe('Request failed (500)')
    expect(err.fieldErrors).toEqual({})
  })

  it('throws a friendly ApiError when the server is unreachable', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const err = await incidentApi.getAll().catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.status).toBe(0)
    expect(err.message).toMatch(/cannot reach the server/i)
  })
})

describe('date helpers', () => {
  afterEach(() => vi.useRealTimers())

  it('todayIso uses the local date, zero-padded', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 0, 5, 23, 30)) // 5 Jan 2026, 23:30 local

    expect(todayIso()).toBe('2026-01-05')
  })

  it('formatDate returns a dash for empty values', () => {
    expect(formatDate(null)).toBe('—')
    expect(formatDate('')).toBe('—')
  })

  it('formatDate formats an ISO date without shifting the day', () => {
    const expected = new Date(2026, 8, 16).toLocaleDateString(undefined,
      { year: 'numeric', month: 'short', day: 'numeric' })
    expect(formatDate('2026-09-16')).toBe(expected)
  })
})
