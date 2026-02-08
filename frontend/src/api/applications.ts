import { apiFetch, type Application, type StatusFlowRow } from '@/lib/api'

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
