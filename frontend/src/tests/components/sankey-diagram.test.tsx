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
  }: {
    data: {
      nodes: { id: string }[]
      links: { source: string; target: string; value: number }[]
    }
    layout: string
    margin: { top: number; right: number; bottom: number; left: number }
  }) => (
    <div
      data-testid="sankey"
      data-layout={layout}
      data-margin={JSON.stringify(margin)}
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
    expect(await screen.findByTestId('sankey')).toHaveAttribute(
      'data-layout',
      'horizontal',
    )
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
