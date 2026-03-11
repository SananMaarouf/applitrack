import { apiFetch, apiUpload, type Application, type StatusFlowRow } from '@/lib/api'
import type { DashboardTrends, TrendPeriod } from '@/types/jobApplication'

export type CreateApplicationPayload = {
  position: string
  company: string
  applied_at: string // ISO string
  expires_at?: string | null
  link?: string | null
}

export async function listApplications(token: string) {
  return apiFetch<Application[]>('/applications', { token })
}

export async function createApplication(token: string, payload: CreateApplicationPayload) {
  return apiFetch<Application>('/applications', {
    method: 'POST',
    token,
    body: JSON.stringify(payload),
  })
}

export async function deleteApplication(token: string, applicationId: number) {
  return apiFetch<void>(`/applications/${applicationId}`, { method: 'DELETE', token })
}

export async function updateApplicationStatus(token: string, applicationId: number, newStatus: number) {
  return apiFetch<{ message: string }>(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    token,
    body: JSON.stringify({ new_status: newStatus }),
  })
}

export async function getStatusFlow(token: string) {
  return apiFetch<StatusFlowRow[]>('/status-flow', { token })
}

/** Upload a PDF file as an attachment for the given application. */
export async function uploadAttachment(token: string, applicationId: number, file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiUpload<Application>(`/applications/${applicationId}/attachment`, form, token)
}

/** Get a short-lived presigned URL to download the attachment. */
export async function getAttachmentUrl(token: string, applicationId: number) {
  return apiFetch<{ url: string }>(`/applications/${applicationId}/attachment/url`, { token })
}

/** Remove the attachment from a job application. */
export async function deleteAttachment(token: string, applicationId: number) {
  return apiFetch<void>(`/applications/${applicationId}/attachment`, {
    method: 'DELETE',
    token,
  })
}

export async function getDashboardTrends(token: string, period: TrendPeriod = 'week') {
  return apiFetch<DashboardTrends>(`/dashboard/trends?period=${period}`, { token })
}
