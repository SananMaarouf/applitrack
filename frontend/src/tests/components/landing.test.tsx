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

import { Landing } from '@/components/landing'

describe('Landing dashboard preview', () => {
  it('uses the shared trend cards as a clearly labelled read-only sample', () => {
    render(<Landing />)

    const figure = screen.getByRole('figure')

    expect(
      within(figure).getByText('Dashboard overview · Sample data'),
    ).toBeInTheDocument()
    expect(within(figure).getByText('Read-only')).toBeInTheDocument()
    expect(within(figure).getByText('Week')).toBeInTheDocument()
    expect(within(figure).getByText('12')).toBeInTheDocument()
    expect(within(figure).getByText('3')).toBeInTheDocument()

    // The sample must stay read-only: no period select or retry button.
    expect(within(figure).queryByRole('combobox')).not.toBeInTheDocument()
    expect(within(figure).queryByRole('button')).not.toBeInTheDocument()
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
