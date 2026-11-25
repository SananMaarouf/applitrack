import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}))

vi.mock('@nivo/sankey', () => ({
  ResponsiveSankey: ({
    data,
    layout,
    margin,
    labelTextColor,
    theme,
  }: {
    data: {
      nodes: { id: string }[]
      links: { source: string; target: string; value: number }[]
    }
    layout: string
    margin: { top: number; right: number; bottom: number; left: number }
    labelTextColor: string
    theme: {
      labels: {
        text: {
          fontSize: string
          paintOrder?: string
          stroke?: string
          strokeWidth?: number
        }
      }
    }
  }) => (
    <div
      data-testid="sankey"
      data-layout={layout}
      data-margin={JSON.stringify(margin)}
      data-label-color={labelTextColor}
      data-label-font-size={theme.labels.text.fontSize}
      data-label-paint-order={theme.labels.text.paintOrder}
      data-label-stroke={theme.labels.text.stroke}
      data-label-stroke-width={theme.labels.text.strokeWidth}
    >
      {data.links.map((link) => (
        <span key={`${link.source}-${link.target}`} data-testid="sankey-link">
          {`${link.source}->${link.target}:${link.value}`}
        </span>
      ))}
    </div>
  ),
}))

vi.mock('html2canvas-pro', () => ({ default: vi.fn() }))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

import {
  SankeyDiagram,
  type SankeyFlowItem,
} from '@/components/sankey-diagram'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'

const sampleFlow: SankeyFlowItem[] = [
  { from: 'Applied', to: 'Interview', weight: 12 },
  { from: 'Applied', to: 'Rejected', weight: 6 },
  { from: 'Applied', to: 'Ghosted', weight: 4 },
  { from: 'Interview', to: 'Second Interview', weight: 6 },
  { from: 'Interview', to: 'Rejected', weight: 4 },
  { from: 'Interview', to: 'Ghosted', weight: 2 },
  { from: 'Second Interview', to: 'Offer', weight: 3 },
  { from: 'Second Interview', to: 'Rejected', weight: 3 },
]

beforeEach(() => {
  useAggregatedStatusHistoryStore.setState({ aggregatedStatusHistory: [] })
})

describe('SankeyDiagram', () => {
  it('renders explicit read-only data without consulting the dashboard store', async () => {
    useAggregatedStatusHistoryStore.setState({
      aggregatedStatusHistory: [
        { From: 'Offer', To: 'Applied', Weight: 9 },
      ],
    })

    render(
      <SankeyDiagram
        data={sampleFlow}
        layout="vertical"
        ariaLabel="Sample status flow"
      />,
    )

    expect(
      await screen.findByRole('img', { name: 'Sample status flow' }),
    ).toBeInTheDocument()

    const chart = await screen.findByTestId('sankey')
    expect(chart).toHaveAttribute('data-layout', 'vertical')
    const margin = JSON.parse(chart.getAttribute('data-margin') ?? '{}')
    expect(margin.top).toBeGreaterThanOrEqual(32)
    expect(margin.bottom).toBeGreaterThanOrEqual(32)

    const links = await screen.findAllByTestId('sankey-link')
    expect(links).toHaveLength(sampleFlow.length)
    expect(links.map((link) => link.textContent)).toContain(
      'Second Interview->Offer:3',
    )
    expect(screen.queryByText('Offer->Applied:9')).not.toBeInTheDocument()
  })

  it('keeps the store-backed dashboard default and viewport layout', async () => {
    useAggregatedStatusHistoryStore.setState({
      aggregatedStatusHistory: [
        { From: 'Applied', To: 'Interview', Weight: 5 },
      ],
    })

    render(<SankeyDiagram />)

    expect(await screen.findByText('Applied->Interview:5')).toBeInTheDocument()
    const sankey = await screen.findByTestId('sankey')
    expect(sankey).toHaveAttribute('data-layout', 'horizontal')

    // The default dashboard chart keeps its opaque surface and plain labels.
    expect(screen.getByRole('img').parentElement).toHaveClass('bg-surface')
    expect(sankey).not.toHaveAttribute('data-label-paint-order')

    // The default dashboard chart keeps its explicit height/min-height.
    expect(screen.getByRole('img')).toHaveClass(
      'min-h-96',
      'md:h-72',
      'md:min-h-0',
    )
  })

  it('drops the shared surface and haloes labels for the transparent landing chart', async () => {
    render(
      <SankeyDiagram
        data={sampleFlow}
        layout="vertical"
        transparentBackground
      />,
    )

    const chart = await screen.findByRole('img')
    expect(chart.parentElement).not.toHaveClass('bg-surface')

    const sankey = await screen.findByTestId('sankey')
    expect(sankey).toHaveAttribute('data-label-paint-order', 'stroke')
    expect(sankey).toHaveAttribute('data-label-stroke-width', '3')
    expect(sankey).toHaveAttribute('data-label-font-size', '0.78rem')
    // currentColor keeps the fill tied to the embed's themed text colour, and
    // the halo stroke is an ordinary style that can stay a live CSS variable.
    expect(sankey).toHaveAttribute('data-label-color', 'currentColor')
    expect(sankey).toHaveAttribute('data-label-stroke', 'var(--background)')
  })

  it('passes grid stretch through its wrappers for embedding layouts', async () => {
    render(
      <SankeyDiagram
        data={sampleFlow}
        heightClassName="lg:h-auto lg:min-h-80"
      />,
    )

    const chart = await screen.findByRole('img')
    expect(chart).toHaveClass('lg:h-auto', 'lg:min-h-80')

    // Both wrappers must be grid containers so a stretched grid item can
    // propagate its full height down to the chart.
    expect(chart.parentElement).toHaveClass('grid')
    expect(chart.parentElement?.parentElement).toHaveClass('grid')
  })

  it('filters backward transitions so Nivo still receives an acyclic graph', async () => {
    render(
      <SankeyDiagram
        data={[
          { from: 'Interview', to: 'Applied', weight: 4 },
          { from: 'Applied', to: 'Interview', weight: 2 },
        ]}
      />,
    )

    const links = await screen.findAllByTestId('sankey-link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveTextContent('Applied->Interview:2')
  })
})
