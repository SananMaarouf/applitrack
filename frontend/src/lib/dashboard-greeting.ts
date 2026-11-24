export type GreetingPeriod = 'morning' | 'afternoon' | 'evening' | 'late-night'

export type DashboardGreeting = {
  period: GreetingPeriod
  title: string
  subtitle: string
}

const ANONYMOUS_NAME = 'there'

/**
 * Maps a local-time hour to the greeting period used by the dashboard.
 * Hours are normalised so 24 -> 0 and -1 -> 23.
 */
export function getGreetingPeriod(hour: number): GreetingPeriod {
  const normalisedHour = ((Math.trunc(hour) % 24) + 24) % 24

  if (normalisedHour >= 5 && normalisedHour <= 11) return 'morning'
  if (normalisedHour >= 12 && normalisedHour <= 17) return 'afternoon'
  if (normalisedHour >= 18 && normalisedHour <= 22) return 'evening'
  return 'late-night'
}

/**
 * Resolves the safest possible display name without ever exposing an email.
 * Prefers the Clerk first name, then the full name, then a neutral fallback.
 */
export function resolveDashboardName(
  firstName?: string | null,
  fullName?: string | null,
): string {
  const first = firstName?.trim()
  if (first) return first

  const full = fullName?.trim()
  if (full) return full

  return ANONYMOUS_NAME
}

function greetingTitle(period: GreetingPeriod, name: string): string {
  switch (period) {
    case 'morning':
      return `Good morning, ${name}`
    case 'afternoon':
      return `Good afternoon, ${name}`
    case 'evening':
      return `Good evening, ${name}`
    case 'late-night':
      return `Late night session huh, ${name}?`
  }
}

function greetingSubtitle(period: GreetingPeriod): string {
  switch (period) {
    case 'morning':
      return 'Here is how your application pipeline is looking this morning.'
    case 'afternoon':
      return 'Here is how your application pipeline is shaping up today.'
    case 'evening':
      return 'A quick look at where your applications stand tonight.'
    case 'late-night':
      return 'Burning the midnight oil? Here is your pipeline at a glance.'
  }
}

export function buildDashboardGreeting(hour: number, name?: string | null): DashboardGreeting {
  const period = getGreetingPeriod(hour)
  const safeName = name?.trim() || ANONYMOUS_NAME

  return {
    period,
    title: greetingTitle(period, safeName),
    subtitle: greetingSubtitle(period),
  }
}
