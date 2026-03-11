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

export type TrendDirection = 'up' | 'down' | 'neutral'
export type TrendPeriod = 'week' | 'month'

export type TrendMetric = {
  current: number
  previous: number
  difference: number
  percentChange: number | null
  direction: TrendDirection
}

export type DashboardTrends = {
  period: TrendPeriod
  ranges: {
    current_start: string
    current_end: string
    previous_start: string
    previous_end: string
  }
  applications_sent: TrendMetric
  interviews: TrendMetric
}
