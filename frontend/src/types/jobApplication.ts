export type JobApplication = {
  id: number
  created_at: string
  user_id: string
  applied_at: string
  expires_at?: string
  position: string
  company: string
  status: number
  link?: string
  attachment_key?: string | null
}

export type AggregatedStatusHistory = {
  From: string
  To: string
  Weight: number
}
