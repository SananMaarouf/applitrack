import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FirstApplicationJourney } from '@/components/first-application-journey'
import { FirstApplicationWelcome } from '@/components/first-application-welcome'

afterEach(() => {
  vi.useRealTimers()
})

describe('FirstApplicationWelcome', () => {
  it('offers one oversized native register button', async () => {
    const user = userEvent.setup()
    const onRegister = vi.fn()

    render(<FirstApplicationWelcome onRegister={onRegister} />)

    const button = screen.getByRole('button', {
      name: /register your first application/i,
    })
    expect(button).toBeInTheDocument()
    expect(button.tagName).toBe('BUTTON')

    await user.click(button)
    expect(onRegister).toHaveBeenCalledTimes(1)
  })
})

describe('FirstApplicationJourney', () => {
  it('advances through three beats and completes within 2.1 seconds', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()

    render(<FirstApplicationJourney onComplete={onComplete} />)

    expect(screen.getByRole('img', { name: /application document/i })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Application registered')
    expect(onComplete).not.toHaveBeenCalled()

    act(() => {
      vi.advanceTimersByTime(650)
    })
    expect(screen.getByRole('status')).toHaveTextContent('Your route is mapped')

    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByRole('status')).toHaveTextContent('First step complete')

    act(() => {
      vi.advanceTimersByTime(750)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)

    // Completion is idempotent even if a late timer fires.
    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('focuses the actual Skip control on entry', async () => {
    render(<FirstApplicationJourney onComplete={vi.fn()} />)

    const skip = screen.getByRole('button', { name: /skip animation/i })
    await waitFor(() => expect(skip).toHaveFocus())
  })

  it('lets the user skip at any point', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()

    render(<FirstApplicationJourney onComplete={onComplete} />)

    await user.click(screen.getByRole('button', { name: /skip animation/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: /skip animation/i }))
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('completes immediately for reduced-motion users', () => {
    const onComplete = vi.fn()

    render(<FirstApplicationJourney onComplete={onComplete} prefersReducedMotion />)

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('clears every timer when unmounted', () => {
    vi.useFakeTimers()
    const onComplete = vi.fn()

    const { unmount } = render(<FirstApplicationJourney onComplete={onComplete} />)
    unmount()

    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(onComplete).not.toHaveBeenCalled()
  })
})
