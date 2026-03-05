import { describe, it, expect, vi, beforeEach } from 'vitest'
import * as apiLib from '@/lib/api'
import {
  listApplications,
  createApplication,
  deleteApplication,
  updateApplicationStatus,
  getStatusFlow,
  uploadAttachment,
  getAttachmentUrl,
  deleteAttachment,
} from '@/api/applications'
import type { Application } from '@/lib/api'

// ── fixtures ──────────────────────────────────────────────────────────────────

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: 1,
    created_at: '2026-01-01T00:00:00Z',
    user_id: 'user_abc',
    applied_at: '2026-01-01T00:00:00Z',
    position: 'Software Engineer',
    company: 'Acme Corp',
    status: 1,
    ...overrides,
  }
}

const TOKEN = 'tok_test'

// ── tests ─────────────────────────────────────────────────────────────────────

describe('api/applications', () => {
  let apiFetchSpy: ReturnType<typeof vi.spyOn>
  let apiUploadSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    apiFetchSpy = vi.spyOn(apiLib, 'apiFetch')
    apiUploadSpy = vi.spyOn(apiLib, 'apiUpload')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // ── listApplications ──────────────────────────────────────────────────────

  describe('listApplications', () => {
    it('calls GET /applications with the token', async () => {
      const apps = [makeApplication(), makeApplication({ id: 2, company: 'Globex' })]
      apiFetchSpy.mockResolvedValue(apps)

      const result = await listApplications(TOKEN)

      expect(apiFetchSpy).toHaveBeenCalledWith('/applications', { token: TOKEN })
      expect(result).toEqual(apps)
    })
  })

  // ── createApplication ─────────────────────────────────────────────────────

  describe('createApplication', () => {
    it('calls POST /applications and returns the created application', async () => {
      const payload = {
        position: 'SWE',
        company: 'Acme',
        applied_at: '2026-01-01T00:00:00Z',
        expires_at: null,
        link: null,
      }
      const created = makeApplication({ position: 'SWE', company: 'Acme' })
      apiFetchSpy.mockResolvedValue(created)

      const result = await createApplication(TOKEN, payload)

      expect(apiFetchSpy).toHaveBeenCalledWith('/applications', {
        method: 'POST',
        token: TOKEN,
        body: JSON.stringify(payload),
      })
      expect(result).toEqual(created)
    })
  })

  // ── deleteApplication ─────────────────────────────────────────────────────

  describe('deleteApplication', () => {
    it('calls DELETE /applications/:id', async () => {
      apiFetchSpy.mockResolvedValue(undefined)

      await deleteApplication(TOKEN, 42)

      expect(apiFetchSpy).toHaveBeenCalledWith('/applications/42', {
        method: 'DELETE',
        token: TOKEN,
      })
    })
  })

  // ── updateApplicationStatus ────────────────────────────────────────────────

  describe('updateApplicationStatus', () => {
    it('calls PATCH /applications/:id/status with the new status', async () => {
      apiFetchSpy.mockResolvedValue({ message: 'Status updated' })

      const result = await updateApplicationStatus(TOKEN, 7, 3)

      expect(apiFetchSpy).toHaveBeenCalledWith('/applications/7/status', {
        method: 'PATCH',
        token: TOKEN,
        body: JSON.stringify({ new_status: 3 }),
      })
      expect(result).toEqual({ message: 'Status updated' })
    })
  })

  // ── getStatusFlow ─────────────────────────────────────────────────────────

  describe('getStatusFlow', () => {
    it('calls GET /status-flow with the token', async () => {
      const rows = [{ user_id: 'user_abc', From: 'Applied', To: 'Interview', Weight: 5 }]
      apiFetchSpy.mockResolvedValue(rows)

      const result = await getStatusFlow(TOKEN)

      expect(apiFetchSpy).toHaveBeenCalledWith('/status-flow', { token: TOKEN })
      expect(result).toEqual(rows)
    })
  })

  // ── uploadAttachment ──────────────────────────────────────────────────────

  describe('uploadAttachment', () => {
    it('calls POST /applications/:id/attachment with FormData', async () => {
      const updated = makeApplication({ attachment_key: 'uploads/cv.pdf' })
      apiUploadSpy.mockResolvedValue(updated)

      const file = new File(['content'], 'cv.pdf', { type: 'application/pdf' })
      const result = await uploadAttachment(TOKEN, 1, file)

      expect(apiUploadSpy).toHaveBeenCalledWith(
        '/applications/1/attachment',
        expect.any(FormData),
        TOKEN,
      )
      // Verify the FormData key
      const formData: FormData = apiUploadSpy.mock.calls[0][1]
      expect(formData.get('file')).toBe(file)
      expect(result).toEqual(updated)
    })
  })

  // ── getAttachmentUrl ──────────────────────────────────────────────────────

  describe('getAttachmentUrl', () => {
    it('calls GET /applications/:id/attachment/url and returns the url', async () => {
      const url = 'https://s3.example.com/cv.pdf?token=xyz'
      apiFetchSpy.mockResolvedValue({ url })

      const result = await getAttachmentUrl(TOKEN, 1)

      expect(apiFetchSpy).toHaveBeenCalledWith('/applications/1/attachment/url', { token: TOKEN })
      expect(result).toEqual({ url })
    })
  })

  // ── deleteAttachment ──────────────────────────────────────────────────────

  describe('deleteAttachment', () => {
    it('calls DELETE /applications/:id/attachment', async () => {
      apiFetchSpy.mockResolvedValue(undefined)

      await deleteAttachment(TOKEN, 99)

      expect(apiFetchSpy).toHaveBeenCalledWith('/applications/99/attachment', {
        method: 'DELETE',
        token: TOKEN,
      })
    })
  })
})
