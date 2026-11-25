import type { ReactNode } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

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
    transparentBackground,
  }: {
    data: readonly { from: string; to: string; weight: number }[]
    heightClassName?: string
    layout?: string
    ariaLabel?: string
    transparentBackground?: boolean
  }) => (
    <div
      role="img"
      aria-label={ariaLabel}
      data-height={heightClassName}
      data-layout={layout}
      data-transparent={transparentBackground}
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

const DESKTOP_QUERY = '(min-width: 80rem) and (pointer: fine)'

/**
 * Install a controllable `matchMedia` so the real `useMediaQuery` hook drives
 * the preview. Returns a setter that also emits a change event, which lets a
 * test exercise the hook's live listener.
 */
function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>()
  let matches = initialMatches

  const mediaQueryList = {
    get matches() {
      return matches
    },
    media: DESKTOP_QUERY,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener)
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener)
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }

  const matchMedia = vi
    .spyOn(window, 'matchMedia')
    .mockReturnValue(mediaQueryList as unknown as MediaQueryList)

  return {
    matchMedia,
    setMatches(next: boolean) {
      matches = next
      const event = { matches, media: mediaQueryList.media } as MediaQueryListEvent
      for (const listener of listeners) listener(event)
    },
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Landing dashboard preview', () => {
  it('renders only the shared status flow chart with clearly labelled sample data', () => {
    installMatchMedia(false)
    render(<Landing />)

    const chart = screen.getByRole('img', {
      name: /sample status flow/i,
    })

    expect(chart).toHaveAttribute(
      'data-height',
      expect.stringContaining('min-h-[18rem]'),
    )
    expect(chart).toHaveAttribute(
      'data-height',
      expect.stringContaining('sm:min-h-[28rem]'),
    )
    expect(chart).toHaveAttribute(
      'data-height',
      expect.stringContaining('md:h-80'),
    )
    // On desktop the chart fills the hero grid row (inside its padding) while
    // keeping a 20rem minimum; narrow/tablet sizing above is unchanged.
    expect(chart).toHaveAttribute(
      'data-height',
      expect.stringContaining('lg:h-auto'),
    )
    expect(chart).toHaveAttribute(
      'data-height',
      expect.stringContaining('lg:min-h-80'),
    )
    expect(chart.parentElement).toHaveClass(
      'lg:grid',
      'lg:self-stretch',
      'lg:col-start-2',
      'lg:row-start-1',
      'lg:row-span-2',
    )
    // Phones tighten only the hero's row gap so the chart sits closer to the
    // copy; column gap and desktop overrides stay intact.
    expect(chart.parentElement?.parentElement).toHaveClass(
      'gap-y-6',
      'sm:gap-y-8',
      'lg:gap-x-16',
      'lg:gap-y-0',
      'lg:grid-cols-[1.02fr_0.98fr]',
    )
    expect(chart.parentElement?.parentElement).not.toHaveClass('gap-y-12')
    expect(chart).toHaveAttribute('data-layout', 'vertical')
    expect(chart).toHaveAttribute('data-transparent', 'true')
    expect(chart).not.toHaveAttribute(
      'data-height',
      expect.stringContaining('bg-surface'),
    )
    expect(chart).toHaveAccessibleName(/Applied 22: Interview 12/i)

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

    // The preview shows the chart alone, without the former card chrome,
    // totals list, or explanatory footer.
    expect(screen.queryByRole('figure')).not.toBeInTheDocument()
    expect(screen.queryByText('Status flow')).not.toBeInTheDocument()
    expect(screen.queryByText('Sample data')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Sample status totals'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/illustrative flow only/i),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('definition')).not.toBeInTheDocument()

    // The preview must stay read-only and free of dashboard export controls.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/export/i)).not.toBeInTheDocument()
  })

  it('keeps the preview between the intro copy and calls to action in document order', () => {
    const media = installMatchMedia(false)
    render(<Landing />)

    const follows = (first: Element, second: Element) =>
      Boolean(
        first.compareDocumentPosition(second) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      )

    const heading = screen.getByRole('heading', {
      level: 1,
      name: /stay on track with applitrack/i,
    })
    const intro = screen.getByText(
      /track applications, interviews, offers, rejections/i,
    )
    const chart = screen.getByRole('img', { name: /sample status flow/i })
    const primaryCta = screen.getByRole('link', {
      name: /start tracking for free/i,
    })

    expect(follows(heading, intro)).toBe(true)
    expect(follows(intro, chart)).toBe(true)
    expect(follows(chart, primaryCta)).toBe(true)

    // The single chart stays in the same semantic position when the hero
    // switches to its two-column layout.
    act(() => media.setMatches(true))
    expect(follows(intro, chart)).toBe(true)
    expect(follows(chart, primaryCta)).toBe(true)
  })

  it('uses the horizontal flow only on desktop-sized fine-pointer screens and switches live', () => {
    const media = installMatchMedia(false)
    render(<Landing />)

    expect(media.matchMedia).toHaveBeenCalledWith(DESKTOP_QUERY)

    expect(
      screen.getByRole('img', { name: /sample status flow/i }),
    ).toHaveAttribute('data-layout', 'vertical')

    act(() => media.setMatches(true))
    expect(
      screen.getByRole('img', { name: /sample status flow/i }),
    ).toHaveAttribute('data-layout', 'horizontal')

    act(() => media.setMatches(false))
    expect(
      screen.getByRole('img', { name: /sample status flow/i }),
    ).toHaveAttribute('data-layout', 'vertical')
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
