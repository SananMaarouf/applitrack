const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export type Application = {
  id: number
  created_at: string
  user_id: string
  applied_at: string
  expires_at?: string | null
  position: string
  company: string
  status: number
  link?: string | null
}

export type StatusFlowRow = {
  user_id: string
  From: string
  To: string
  Weight: number
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { userId?: string } = {},
): Promise<T> {
  const { userId, headers, ...rest } = options

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...(headers ?? {}),
      ...(userId ? { 'X-User-Id': userId } : {}),
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(text || `Request failed: ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}
