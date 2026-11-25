import type { ReactNode } from 'react'
import { act, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// The public landing page must never pull the interactive dashboard chart into
// its startup path. These factories throw if either module is imported, so a
// regression fails here instead of silently mounting @nivo/sankey again.
vi.mock('@/components/sankey-diagram', () => {
  throw new Error('Landing must not import the interactive SankeyDiagram')
})

vi.mock('@nivo/sankey', () => {
  throw new Error('Landing must not import @nivo/sankey')
})

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

const DESKTOP_QUERY = '(min-width: 64rem)'
const TABLET_QUERY = '(min-width: 48rem)'
const PHONE_VIEW_BOX = '0 0 360 270'
const TABLET_VIEW_BOX = '0 0 900 320'
const DESKTOP_VIEW_BOX = '0 0 500 300'

type Viewport = 'phone' | 'tablet' | 'desktop'
type Orientation = 'horizontal' | 'vertical'

const STATUS_LABELS = [
  'Applied',
  'Interview',
  'Second Interview',
  'Offer',
  'Rejected',
  'Ghosted',
] as const

const SAMPLE_FLOWS = [
  { from: 'Applied', to: 'Interview', weight: 12 },
  { from: 'Applied', to: 'Rejected', weight: 6 },
  { from: 'Applied', to: 'Ghosted', weight: 4 },
  { from: 'Interview', to: 'Second Interview', weight: 6 },
  { from: 'Interview', to: 'Rejected', weight: 4 },
  { from: 'Interview', to: 'Ghosted', weight: 2 },
  { from: 'Second Interview', to: 'Offer', weight: 3 },
  { from: 'Second Interview', to: 'Rejected', weight: 3 },
] as const

/**
 * Install a controllable `matchMedia` for the two breakpoints the preview
 * uses. The same spy drives the real `useMediaQuery` hooks, so tests can assert
 * the live layout switch without any element measurement.
 */
function installMatchMedia(initialViewport: Viewport) {
  const listeners = new Map<
    string,
    Set<(event: MediaQueryListEvent) => void>
  >()
  const matches = new Map<string, boolean>([
    [DESKTOP_QUERY, initialViewport === 'desktop'],
    [TABLET_QUERY, initialViewport !== 'phone'],
  ])

  const matchMedia = vi
    .spyOn(window, 'matchMedia')
    .mockImplementation((query: string) => {
      if (!listeners.has(query)) listeners.set(query, new Set())
      const queryListeners = listeners.get(query)!

      return {
        get matches() {
          return matches.get(query) ?? false
        },
        media: query,
        onchange: null,
        addEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          queryListeners.add(listener)
        },
        removeEventListener: (
          _type: string,
          listener: (event: MediaQueryListEvent) => void,
        ) => {
          queryListeners.delete(listener)
        },
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      } as unknown as MediaQueryList
    })

  function setViewport(next: Viewport) {
    const nextMatches: Record<string, boolean> = {
      [DESKTOP_QUERY]: next === 'desktop',
      [TABLET_QUERY]: next !== 'phone',
    }

    for (const [query, nextMatch] of Object.entries(nextMatches)) {
      if (matches.get(query) === nextMatch) continue
      matches.set(query, nextMatch)
      const event = {
        matches: nextMatch,
        media: query,
      } as MediaQueryListEvent
      for (const listener of listeners.get(query) ?? []) listener(event)
    }
  }

  return { matchMedia, setViewport }
}

function getChart() {
  return screen.getByRole('img', { name: /sample status flow/i })
}

function pathPoints(d: string) {
  const numbers = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number)
  return {
    startX: numbers[0],
    startY: numbers[1],
    endX: numbers[numbers.length - 2],
    endY: numbers[numbers.length - 1],
  }
}

function expectStaticStatusFlow(
  viewBox: string,
  orientation: Orientation,
  labelFontSize: string,
) {
  const chart = getChart()

  // The chart is a real, synchronously rendered SVG — not the mocked/async
  // interactive component and not a canvas fallback.
  expect(chart.tagName.toLowerCase()).toBe('svg')
  expect(chart).toHaveAttribute('viewBox', viewBox)
  expect(chart.querySelector('canvas')).toBeNull()
  expect(chart.querySelector('foreignObject')).toBeNull()

  for (const label of STATUS_LABELS) {
    const text = within(chart).getByText(label)
    expect(text).toBeInTheDocument()
    expect(text).toHaveAttribute('font-size', labelFontSize)
  }

  const flowPaths = Array.from(
    chart.querySelectorAll<SVGPathElement>('[data-flow]'),
  )
  expect(flowPaths).toHaveLength(SAMPLE_FLOWS.length)
  expect(
    new Set(flowPaths.map((path) => path.getAttribute('d'))).size,
  ).toBe(SAMPLE_FLOWS.length)

  for (const flow of SAMPLE_FLOWS) {
    const path = chart.querySelector(
      `[data-flow][data-from="${flow.from}"][data-to="${flow.to}"][data-weight="${flow.weight}"]`,
    )
    expect(path).not.toBeNull()

    const points = pathPoints(path!.getAttribute('d')!)
    // Every ribbon moves forward through the status stage order.
    if (orientation === 'horizontal') {
      expect(points.endX).toBeGreaterThan(points.startX)
    } else {
      expect(points.endY).toBeGreaterThan(points.startY)
    }
  }

  // Flows sharing a source node must not collapse onto one centre point.
  const appliedStarts = flowPaths
    .filter((path) => path.getAttribute('data-from') === 'Applied')
    .map((path) => {
      const { startX, startY } = pathPoints(path.getAttribute('d')!)
      return `${startX},${startY}`
    })
  expect(appliedStarts).toHaveLength(3)
  expect(new Set(appliedStarts).size).toBe(3)

  // Node colours come from the same theme tokens as the dashboard charts.
  expect(chart.querySelector('[data-status="Applied"] rect')).toHaveAttribute(
    'fill',
    'var(--status-applied-chart)',
  )
  expect(
    chart.querySelector('[data-status="Second Interview"] rect'),
  ).toHaveAttribute('fill', 'var(--status-second-interview-chart)')

  expect(chart).toHaveAccessibleName(/Applied 22: Interview 12/i)
  expect(chart).toHaveAccessibleName(
    /Second Interview 6: Offer 3, Rejected 3/i,
  )

  return chart
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Landing dashboard preview', () => {
  it('renders the real static SVG flow synchronously on phones without excess height', () => {
    installMatchMedia('phone')
    render(<Landing />)

    const chart = expectStaticStatusFlow(PHONE_VIEW_BOX, 'vertical', '13')

    expect(chart).toHaveClass('mx-auto', 'w-full', 'h-[18rem]', 'md:h-[20rem]')
    expect(chart).toHaveAttribute('fill', 'none')
    expect(chart).not.toHaveClass('bg-surface')

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

    // The preview shows the chart alone, without the former card chrome,
    // totals list, or explanatory footer.
    expect(screen.queryByRole('figure')).not.toBeInTheDocument()
    expect(screen.queryByText('Status flow')).not.toBeInTheDocument()
    expect(screen.queryByText('Sample data')).not.toBeInTheDocument()
    expect(screen.queryByText('Sample status totals')).not.toBeInTheDocument()
    expect(screen.queryByText(/illustrative flow only/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('definition')).not.toBeInTheDocument()

    // The preview must stay read-only and free of dashboard export controls.
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByText(/export/i)).not.toBeInTheDocument()
  })

  it('keeps a capped wide chart on 955px tablets', () => {
    installMatchMedia('tablet')
    render(<Landing />)

    const chart = expectStaticStatusFlow(TABLET_VIEW_BOX, 'horizontal', '14')

    expect(chart).toHaveClass('h-[18rem]', 'md:h-[20rem]')
    expect(chart).not.toHaveClass('min-h-[28rem]')
  })

  it('renders a distinct desktop SVG geometry with readable labels', () => {
    installMatchMedia('desktop')
    render(<Landing />)

    const chart = expectStaticStatusFlow(DESKTOP_VIEW_BOX, 'horizontal', '14')

    expect(chart).not.toHaveAttribute('viewBox', PHONE_VIEW_BOX)
    expect(chart).not.toHaveAttribute('viewBox', TABLET_VIEW_BOX)
    expect(chart).toHaveClass('h-[18rem]', 'md:h-[20rem]')
  })

  it('keeps the preview between the intro copy and calls to action in document order', () => {
    const media = installMatchMedia('phone')
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
    const chart = getChart()
    const primaryCta = screen.getByRole('link', {
      name: /start tracking for free/i,
    })

    expect(follows(heading, intro)).toBe(true)
    expect(follows(intro, chart)).toBe(true)
    expect(follows(chart, primaryCta)).toBe(true)

    // The single chart stays in the same semantic position when the hero
    // switches to its two-column layout.
    act(() => media.setViewport('desktop'))
    expect(follows(intro, chart)).toBe(true)
    expect(follows(chart, primaryCta)).toBe(true)
  })

  it('switches layout live without remounting the chart or changing content', () => {
    const media = installMatchMedia('phone')
    render(<Landing />)

    expect(media.matchMedia).toHaveBeenCalledWith(DESKTOP_QUERY)
    expect(media.matchMedia).toHaveBeenCalledWith(TABLET_QUERY)
    expect(getChart()).toHaveAttribute('viewBox', PHONE_VIEW_BOX)

    act(() => media.setViewport('tablet'))
    expect(getChart()).toHaveAttribute('viewBox', TABLET_VIEW_BOX)

    act(() => media.setViewport('desktop'))
    expect(getChart()).toHaveAttribute('viewBox', DESKTOP_VIEW_BOX)
    expect(getChart().querySelectorAll('[data-flow]')).toHaveLength(
      SAMPLE_FLOWS.length,
    )

    act(() => media.setViewport('phone'))
    expect(getChart()).toHaveAttribute('viewBox', PHONE_VIEW_BOX)
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
