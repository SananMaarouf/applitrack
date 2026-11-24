import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    children,
    ...props
  }: {
    to?: string
    children?: ReactNode
    [key: string]: unknown
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/sankey-diagram', () => ({
  SankeyDiagram: ({
    data,
    heightClassName,
    layout,
    ariaLabel,
  }: {
    data: readonly { from: string; to: string; weight: number }[]
    heightClassName?: string
    layout?: string
    ariaLabel?: string
  }) => (
    <div
      role="img"
      aria-label={ariaLabel}
      data-height={heightClassName}
      data-layout={layout}
    >
      {data.map((edge) => (
        <span key={`${edge.from}-${edge.to}`}>
          {`${edge.from} → ${edge.to}: ${edge.weight}`}
        </span>
      ))}
    </div>
  ),
}))

import { Landing } from '@/components/landing'

describe('Landing dashboard preview', () => {
  it('uses the shared status flow renderer with clearly labelled sample data', () => {
    render(<Landing />)

    const figure = screen.getByRole('figure')

    expect(within(figure).getByText('Status flow')).toBeInTheDocument()
    expect(within(figure).getByText('Sample data')).toBeInTheDocument()
    expect(
      within(figure).getByText('Illustrative flow only — not your application data.'),
    ).toBeInTheDocument()

    const chart = within(figure).getByRole('img', {
      name: /sample status flow/i,
    })
    expect(chart).toHaveAttribute(
      'data-height',
      expect.stringContaining('min-h-[26rem]'),
    )
    expect(chart).toHaveAttribute('data-layout', 'vertical')
    expect(chart).toHaveAccessibleName(/Applied 22: Interview 12/i)

    const totals = within(figure).getByLabelText('Sample status totals')
    expect(within(totals).getByText('Applied')).toBeInTheDocument()
    expect(within(totals).getByText('22')).toBeInTheDocument()
    expect(within(totals).getByText('Second Interview')).toBeInTheDocument()
    expect(within(totals).getByText('13')).toBeInTheDocument()

    for (const edge of [
      'Applied → Interview: 12',
      'Applied → Rejected: 6',
      'Applied → Ghosted: 4',
      'Interview → Second Interview: 6',
      'Interview → Rejected: 4',
      'Interview → Ghosted: 2',
      'Second Interview → Offer: 3',
      'Second Interview → Rejected: 3',
    ]) {
      expect(within(chart).getByText(edge)).toBeInTheDocument()
    }

    // The preview must stay read-only and free of dashboard export controls.
    expect(within(figure).queryByRole('combobox')).not.toBeInTheDocument()
    expect(within(figure).queryByRole('button')).not.toBeInTheDocument()
    expect(within(figure).queryByText(/export/i)).not.toBeInTheDocument()
  })

  it('removes the inaccurate fake sidebar, offer count, table, and graph', () => {
    render(<Landing />)

    for (const staleLabel of [
      'Board',
      'Roles',
      'Search',
      'Offers',
      'Applications over time',
      'Preview',
      'Illustrative sample of the Applitrack dashboard',
    ]) {
      expect(screen.queryByText(staleLabel)).not.toBeInTheDocument()
    }
  })

  it('keeps the hero headline and primary call to action', () => {
    render(<Landing />)

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /stay on track with applitrack/i,
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /start tracking for free/i }),
    ).toBeInTheDocument()
  })
})
