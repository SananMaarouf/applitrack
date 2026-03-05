import { describe, it, expect, vi, afterEach } from 'vitest'
import { apiFetch, apiUpload } from '@/lib/api'

const BASE_URL = 'http://localhost:8000'

describe('apiFetch', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a GET request and returns parsed JSON', async () => {
    const fakeData = [{ id: 1, company: 'Acme', position: 'Engineer' }]
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeData,
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiFetch<typeof fakeData>('/applications', { token: 'tok_123' })

    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/applications`, {
      headers: {
        Authorization: 'Bearer tok_123',
        'Content-Type': 'application/json',
      },
    })
    expect(result).toEqual(fakeData)
  })

  it('sends a POST request with a body', async () => {
    const payload = { position: 'SWE', company: 'Acme', applied_at: '2026-01-01T00:00:00Z' }
    const created = { id: 42, ...payload }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => created,
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiFetch('/applications', {
      method: 'POST',
      token: 'tok_123',
      body: JSON.stringify(payload),
    })

    expect(fetchMock).toHaveBeenCalledWith(`${BASE_URL}/applications`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        Authorization: 'Bearer tok_123',
        'Content-Type': 'application/json',
      },
    })
    expect(result).toEqual(created)
  })

  it('returns undefined for 204 No Content', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    const result = await apiFetch('/applications/1', { method: 'DELETE', token: 'tok_123' })

    expect(result).toBeUndefined()
  })

  it('omits Authorization header when no token is provided', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    await apiFetch('/health')

    const callArgs = fetchMock.mock.calls[0][1] as RequestInit
    expect((callArgs.headers as Record<string, string>)['Authorization']).toBeUndefined()
  })

  it('throws an error with the detail message on non-OK JSON response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ detail: 'Validation failed' }),
    } as Response))

    await expect(apiFetch('/applications')).rejects.toThrow('Validation failed')
  })

  it('falls back to message field when detail is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Bad input' }),
    } as Response))

    await expect(apiFetch('/applications')).rejects.toThrow('Bad input')
  })

  it('falls back to raw JSON text when neither detail nor message is present', async () => {
    const body = JSON.stringify({ error: 'unknown' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => body,
    } as Response))

    await expect(apiFetch('/applications')).rejects.toThrow(body)
  })

  it('throws an error with the status code when the body is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '',
    } as Response))

    await expect(apiFetch('/applications')).rejects.toThrow('Request failed: 500')
  })

  it('throws an error with raw text when response is not valid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => 'Service Unavailable',
    } as Response))

    await expect(apiFetch('/applications')).rejects.toThrow('Service Unavailable')
  })
})

describe('apiUpload', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends a multipart POST and returns parsed JSON', async () => {
    const updatedApp = { id: 1, attachment_key: 'uploads/cv.pdf' }
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => updatedApp,
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    const form = new FormData()
    form.append('file', new File(['data'], 'cv.pdf'))

    const result = await apiUpload('/applications/1/attachment', form, 'tok_123')

    expect(fetchMock).toHaveBeenCalledWith(
      `${BASE_URL}/applications/1/attachment`,
      expect.objectContaining({
        method: 'POST',
        body: form,
        headers: { Authorization: 'Bearer tok_123' },
      }),
    )
    expect(result).toEqual(updatedApp)
  })

  it('omits Authorization header when token is null', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)

    await apiUpload('/applications/1/attachment', new FormData(), null)

    const callArgs = fetchMock.mock.calls[0][1] as RequestInit
    expect(callArgs.headers).toEqual({})
  })

  it('throws an error on non-OK response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 413,
      text: async () => JSON.stringify({ detail: 'File too large' }),
    } as Response))

    await expect(
      apiUpload('/applications/1/attachment', new FormData(), 'tok_123'),
    ).rejects.toThrow('File too large')
  })

  it('falls back to message field when detail is absent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => JSON.stringify({ message: 'Bad input' }),
    } as Response))

    await expect(
      apiUpload('/applications/1/attachment', new FormData(), 'tok_123'),
    ).rejects.toThrow('Bad input')
  })

  it('falls back to raw JSON text when neither detail nor message is present', async () => {
    const body = JSON.stringify({ error: 'unknown' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => body,
    } as Response))

    await expect(
      apiUpload('/applications/1/attachment', new FormData(), 'tok_123'),
    ).rejects.toThrow(body)
  })

  it('throws with raw text when error body is not valid JSON', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: async () => 'Bad Request',
    } as Response))

    await expect(
      apiUpload('/applications/1/attachment', new FormData(), 'tok_123'),
    ).rejects.toThrow('Bad Request')
  })

  it('falls back to the status code message when reading error body throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => { throw new Error('stream error') },
    } as unknown as Response))

    await expect(
      apiUpload('/applications/1/attachment', new FormData(), 'tok_123'),
    ).rejects.toThrow('Request failed: 503')
  })

  it('uses the status code message when the error body is empty', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => '',
    } as Response))

    await expect(
      apiUpload('/applications/1/attachment', new FormData(), 'tok_123'),
    ).rejects.toThrow('Request failed: 500')
  })
})
