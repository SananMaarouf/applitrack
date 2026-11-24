import { describe, expect, it } from 'vitest'

import {
  buildDashboardGreeting,
  getGreetingPeriod,
  resolveDashboardName,
} from '@/lib/dashboard-greeting'

describe('getGreetingPeriod', () => {
  it.each([5, 8, 11])('treats %i as morning', (hour) => {
    expect(getGreetingPeriod(hour)).toBe('morning')
  })

  it.each([12, 15, 17])('treats %i as afternoon', (hour) => {
    expect(getGreetingPeriod(hour)).toBe('afternoon')
  })

  it.each([18, 20, 22])('treats %i as evening', (hour) => {
    expect(getGreetingPeriod(hour)).toBe('evening')
  })

  it.each([23, 0, 4])('treats %i as late night', (hour) => {
    expect(getGreetingPeriod(hour)).toBe('late-night')
  })

  it('normalises out-of-range hours across midnight', () => {
    expect(getGreetingPeriod(24)).toBe('late-night')
    expect(getGreetingPeriod(29)).toBe('morning')
    expect(getGreetingPeriod(-1)).toBe('late-night')
  })
})

describe('resolveDashboardName', () => {
  it('prefers a trimmed first name', () => {
    expect(resolveDashboardName('  Sam ', 'Sam Doe')).toBe('Sam')
  })

  it('falls back to the full name when the first name is blank', () => {
    expect(resolveDashboardName('   ', 'Alex Doe')).toBe('Alex Doe')
    expect(resolveDashboardName(undefined, 'Alex Doe')).toBe('Alex Doe')
  })

  it('falls back to a safe anonymous greeting with no names', () => {
    expect(resolveDashboardName(undefined, undefined)).toBe('there')
    expect(resolveDashboardName('', '')).toBe('there')
  })
})

describe('buildDashboardGreeting', () => {
  it('greets in the morning', () => {
    expect(buildDashboardGreeting(9, 'Sam').title).toBe('Good morning, Sam')
  })

  it('greets in the afternoon', () => {
    expect(buildDashboardGreeting(14, 'Sam').title).toBe('Good afternoon, Sam')
  })

  it('greets in the evening', () => {
    expect(buildDashboardGreeting(20, 'Sam').title).toBe('Good evening, Sam')
  })

  it('handles midnight as a late night session', () => {
    expect(buildDashboardGreeting(0, 'Sam').title).toBe('Late night session huh, Sam?')
  })

  it('falls back to "there" when the name is missing', () => {
    expect(buildDashboardGreeting(8, '').title).toBe('Good morning, there')
    expect(buildDashboardGreeting(2).title).toBe('Late night session huh, there?')
  })

  it('returns a period and a helpful subtitle', () => {
    const greeting = buildDashboardGreeting(9, 'Sam')
    expect(greeting.period).toBe('morning')
    expect(greeting.subtitle.length).toBeGreaterThan(0)
  })
})
