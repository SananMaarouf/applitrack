import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TrendCards } from '@/components/trendCards'
import type { DashboardTrends, TrendMetric } from '@/types/jobApplication'

function makeMetric(overrides: Partial<TrendMetric> = {}): TrendMetric {
  return {
    current: 12,
    previous: 8,
    difference: 4,
    percentChange: 50,
    direction: 'up',
    ...overrides,
  }
}

function makeTrends(overrides: Partial<DashboardTrends> = {}): DashboardTrends {
  return {
    period: 'week',
    ranges: {
      current_start: '2026-11-17T00:00:00.000Z',
      current_end: '2026-11-24T00:00:00.000Z',
      previous_start: '2026-11-10T00:00:00.000Z',
      previous_end: '2026-11-17T00:00:00.000Z',
    },
    applications_sent: makeMetric(),
    interviews: makeMetric({
      current: 3,
      previous: 4,
      difference: -1,
      percentChange: -25,
      direction: 'down',
    }),
    ...overrides,
  }
}

const zeroMetric: TrendMetric = {
  current: 0,
  previous: 0,
  difference: 0,
  percentChange: 0,
  direction: 'neutral',
}

describe('TrendCards', () => {
  it('shows skeletons exclusively while actively loading', () => {
    const { container } = render(
      <TrendCards trends={null} period="week" isLoading />,
    )

    expect(container.firstChild).toHaveAttribute('aria-busy', 'true')
    expect(screen.getAllByTestId('trend-skeleton')).toHaveLength(2)
    expect(screen.queryByText('Applications sent')).not.toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('renders successful zero counts plus a selected-period empty message', () => {
    render(
      <TrendCards
        trends={makeTrends({
          applications_sent: zeroMetric,
          interviews: zeroMetric,
        })}
        period="week"
        isLoading={false}
      />,
    )

    expect(screen.getAllByText('0')).toHaveLength(2)
    expect(screen.getByText('Applications sent')).toBeInTheDocument()
    expect(screen.getByText('Interviews')).toBeInTheDocument()
    expect(
      screen.getByText(/No applications sent in the last 7 days/),
    ).toBeInTheDocument()
    expect(screen.queryByText('Trends unavailable')).not.toBeInTheDocument()
    expect(screen.queryByTestId('trend-skeleton')).not.toBeInTheDocument()
  })

  it('renders an explicit unavailable state with a working retry on failure', async () => {
    const onRetry = vi.fn()
    const user = userEvent.setup()

    render(
      <TrendCards
        trends={null}
        period="week"
        isLoading={false}
        error="Network unavailable"
        onRetry={onRetry}
      />,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Trends unavailable')).toBeInTheDocument()
    expect(screen.getByText('Network unavailable')).toBeInTheDocument()
    expect(screen.queryByText(/No applications sent/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('treats a missing payload as unavailable rather than an endless skeleton', () => {
    render(
      <TrendCards
        trends={null}
        period="month"
        isLoading={false}
        onRetry={vi.fn()}
      />,
    )

    expect(screen.getByText('Trends unavailable')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    expect(screen.queryByTestId('trend-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })

  it('never shows metrics from a different selected period', () => {
    render(
      <TrendCards
        trends={makeTrends({ period: 'week' })}
        period="month"
        isLoading={false}
      />,
    )

    expect(screen.getByText('Trends unavailable')).toBeInTheDocument()
    expect(screen.queryByText('12')).not.toBeInTheDocument()
  })

  it('offers a non-interactive period label when no change handler is provided', () => {
    render(<TrendCards trends={makeTrends()} period="week" isLoading={false} />)

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Week')).toBeInTheDocument()
    expect(screen.getByText('(read-only)')).toBeInTheDocument()
  })
})
