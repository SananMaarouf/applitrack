import { apiFetch, type Application, type StatusFlowRow } from '@/lib/api'

export type CreateApplicationPayload = {
  position: string
  company: string
  applied_at: string // ISO string
  expires_at?: string | null
  link?: string | null
}

export async function listApplications(userId: string) {
  return apiFetch<Application[]>('/applications', { userId })
}

export async function createApplication(userId: string, payload: CreateApplicationPayload) {
  return apiFetch<Application>('/applications', {
    method: 'POST',
    userId,
    body: JSON.stringify(payload),
  })
}

export async function deleteApplication(userId: string, applicationId: number) {
  return apiFetch<void>(`/applications/${applicationId}`, { method: 'DELETE', userId })
}

export async function updateApplicationStatus(userId: string, applicationId: number, newStatus: number) {
  return apiFetch<{ message: string }>(`/applications/${applicationId}/status`, {
    method: 'PATCH',
    userId,
    body: JSON.stringify({ new_status: newStatus }),
  })
}

export async function getStatusFlow(userId: string) {
  return apiFetch<StatusFlowRow[]>('/status-flow', { userId })
}
