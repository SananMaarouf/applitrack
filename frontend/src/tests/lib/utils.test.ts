import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('cn', () => {
  it('returns a single class unchanged', () => {
    expect(cn('flex')).toBe('flex')
  })

  it('joins multiple classes', () => {
    expect(cn('flex', 'items-center', 'gap-4')).toBe('flex items-center gap-4')
  })

  it('ignores falsy values', () => {
    expect(cn('flex', false, undefined, null, '', 'p-4')).toBe('flex p-4')
  })

  it('resolves Tailwind conflicts – last class wins', () => {
    expect(cn('p-4', 'p-8')).toBe('p-8')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('handles conditional object syntax', () => {
    expect(cn({ 'font-bold': true, 'font-normal': false })).toBe('font-bold')
  })

  it('handles array syntax', () => {
    expect(cn(['flex', 'items-center'])).toBe('flex items-center')
  })

  it('returns an empty string when given no arguments', () => {
    expect(cn()).toBe('')
  })
})
