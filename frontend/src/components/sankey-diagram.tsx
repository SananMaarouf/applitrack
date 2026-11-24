'use client'

import { ResponsiveSankey } from '@nivo/sankey'
import { useAggregatedStatusHistoryStore } from '@/store/aggregatedStatusHistoryStore'
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'

import { JOB_STATUS_OPTIONS } from '@/lib/job-status-ui'

export interface SankeyDiagramHandle {
  exportCSV: () => void
  exportDiagram: () => void
}

export type SankeyFlowItem = {
  from: string
  to: string
  weight: number
}

type SankeyDiagramProps = {
  /**
   * Optional read-only flow data. When omitted, the dashboard's aggregated
   * status history store is used instead.
   */
  data?: readonly SankeyFlowItem[]
  /** Optional height override so embeds can size the chart for their layout. */
  heightClassName?: string
  /**
   * Optional layout override. Without it the dashboard keeps its existing
   * viewport-based horizontal/vertical switch.
   */
  layout?: 'horizontal' | 'vertical'
  ariaLabel?: string
}

type SankeyPalette = {
  nodes: Record<string, string>
  background: string
  foreground: string
  muted: string
  tooltipBackground: string
  tooltipForeground: string
}

const STATUS_ORDER: Record<string, number> = Object.fromEntries(
  JOB_STATUS_OPTIONS.map(({ label }, index) => [label, index + 1]),
)

/**
 * Nivo/d3 perform colour math (and html2canvas serialises colours), so CSS
 * custom properties must be resolved to concrete RGB values for the active theme.
 */
function toRgb(value: string): string | null {
  if (typeof document === 'undefined') return null

  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  const context = canvas.getContext('2d')
  if (!context) return null

  context.fillStyle = 'transparent'
  context.fillStyle = value
  context.fillRect(0, 0, 1, 1)

  const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data
  if (alpha === 0) return null

  return alpha === 255
    ? `rgb(${red}, ${green}, ${blue})`
    : `rgba(${red}, ${green}, ${blue}, ${Number((alpha / 255).toFixed(3))})`
}

function resolveCssColor(expression: string): string {
  if (typeof document === 'undefined') return expression

  const probe = document.createElement('span')
  probe.style.color = expression
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  document.body.appendChild(probe)
  const computed = window.getComputedStyle(probe).color || expression
  probe.remove()

  return toRgb(computed) ?? toRgb(expression) ?? computed
}

const SURFACE_BACKGROUND = 'var(--bg-surface)'
const PRIMARY_FOREGROUND = 'var(--text-primary)'
const SECONDARY_FOREGROUND = 'var(--text-secondary)'
const ELEVATED_BACKGROUND = 'var(--bg-elevated)'

function buildPalette(): SankeyPalette {
  const nodes = JOB_STATUS_OPTIONS.reduce<Record<string, string>>(
    (acc, { label, color }) => {
      acc[label] = resolveCssColor(color)
      return acc
    },
    {},
  )

  return {
    nodes,
    background: resolveCssColor(SURFACE_BACKGROUND),
    foreground: resolveCssColor(PRIMARY_FOREGROUND),
    muted: resolveCssColor(SECONDARY_FOREGROUND),
    tooltipBackground: resolveCssColor(ELEVATED_BACKGROUND),
    tooltipForeground: resolveCssColor(PRIMARY_FOREGROUND),
  }
}

export const SankeyDiagram = forwardRef<SankeyDiagramHandle, SankeyDiagramProps>(
  function SankeyDiagram(
    {
      data,
      heightClassName = 'min-h-96 rounded-lg bg-surface text-foreground md:h-72 md:min-h-0',
      layout,
      ariaLabel = 'Status flow diagram',
    },
    ref,
  ) {
    const aggregatedStatusHistory = useAggregatedStatusHistoryStore(
      (state) => state.aggregatedStatusHistory,
    )
    const flowSource = useMemo<readonly SankeyFlowItem[]>(
      () =>
        data ??
        aggregatedStatusHistory.map((item) => ({
          from: String(item.From),
          to: String(item.To),
          weight: Number(item.Weight),
        })),
      [data, aggregatedStatusHistory],
    )
    const { resolvedTheme } = useTheme()
    const diagramRef = useRef<HTMLDivElement>(null)
    const [palette, setPalette] = useState<SankeyPalette | null>(null)
    const [isNarrow, setIsNarrow] = useState(false)

    const sankeyFlow = useMemo(
      () =>
        flowSource
          // Nivo Sankey requires an acyclic graph, so keep only forward transitions.
          .filter((item) => {
            if (!Number.isFinite(item.weight) || item.weight <= 0) return false
            if (item.from === item.to) return false

            const fromOrder = STATUS_ORDER[item.from]
            const toOrder = STATUS_ORDER[item.to]
            if (!fromOrder || !toOrder) return false

            return fromOrder < toOrder
          }),
      [flowSource],
    )

    const exportCSV = () => {
      const headers = ['From', 'To', 'Weight']
      const rows = flowSource.map((item) => [
        String(item.from),
        String(item.to),
        String(item.weight),
      ])
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const timestamp = new Date().toISOString().split('T')[0]
    link.download = `sankey-data-${timestamp}.csv`
    link.href = url
    link.click()
    URL.revokeObjectURL(url)

    toast.success('CSV exported successfully!')
  }

  const exportDiagram = async () => {
    if (!diagramRef.current) return

    try {
      // Keep the canvas renderer out of landing's shared chunk; export is
      // only exposed on the dashboard.
      const { default: html2canvas } = await import('html2canvas-pro')
      const backgroundColor = resolveCssColor(SURFACE_BACKGROUND)
      const canvas = await html2canvas(diagramRef.current, {
        backgroundColor,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector<HTMLElement>('[data-sankey-canvas]')
          if (clonedElement) {
            clonedElement.style.backgroundColor = backgroundColor
          }
        },
      })

      canvas.toBlob((blob) => {
        if (!blob) return

        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const timestamp = new Date().toISOString().split('T')[0]
        link.download = `sankey-diagram-${timestamp}.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)

        toast.success('Diagram exported successfully!')
      })
    } catch (error) {
      console.error('Error exporting diagram:', error)
      toast.error('Failed to export diagram')
    }
  }

  useEffect(() => {
    const updatePosition = () => {
      setIsNarrow(window.innerWidth < 768)
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    return () => window.removeEventListener('resize', updatePosition)
  }, [])

  // Re-resolve the shared status palette whenever the active theme changes.
  useEffect(() => {
    setPalette(buildPalette())
  }, [resolvedTheme])

  const uniqueNodeIds = useMemo(
    () =>
      Array.from(
        new Set(
          sankeyFlow.reduce<string[]>((ids, item) => {
            ids.push(item.from, item.to)
            return ids
          }, []),
        ),
      ),
    [sankeyFlow],
  )

  const nodes = uniqueNodeIds.map((id) => ({
    id,
    nodeColor:
      palette?.nodes[id] ?? palette?.muted ?? 'var(--muted-foreground)',
  }))

  const links = sankeyFlow.map((item) => ({
    source: item.from,
    target: item.to,
    value: item.weight,
  }))

  const sankeyData = { nodes, links }

  // Vertical layouts place outside labels above/below the nodes, so embeds
  // that force vertical (e.g. the landing preview) need generous top/bottom
  // margins. The dashboard's viewport-based default stays untouched.
  const margin =
    layout === 'vertical'
      ? { top: 36, right: 20, bottom: 36, left: 20 }
      : layout === 'horizontal'
        ? { top: 10, right: 84, bottom: 10, left: 70 }
        : isNarrow
          ? { top: 15, right: 20, bottom: 20, left: 10 }
          : { top: 10, right: 84, bottom: 10, left: 70 }

  useImperativeHandle(ref, () => ({ exportCSV, exportDiagram }))

  return (
    <div className="mx-auto w-full min-w-0">
      <div className="overflow-hidden rounded-xl bg-surface">
        <div
          ref={diagramRef}
          data-sankey-canvas
          role="img"
          aria-label={ariaLabel}
          className={heightClassName}
        >
          {links.length > 0 && palette ? (
            <ResponsiveSankey
              data={sankeyData}
              margin={margin}
              align="justify"
              colors={{ datum: 'nodeColor' }}
              nodeThickness={18}
              nodeSpacing={24}
              linkOpacity={1}
              nodeBorderColor={{ from: 'color', modifiers: [['darker', 0.8]] }}
              enableLinkGradient={true}
              linkBlendMode="normal"
              labelPosition="outside"
              labelOrientation="horizontal"
              labelPadding={10}
              labelTextColor={palette.foreground}
              layout={layout ?? (isNarrow ? 'vertical' : 'horizontal')}
              theme={{
                labels: {
                  text: {
                    fontSize: '0.7rem',
                    fontWeight: 'bolder',
                  },
                },
                tooltip: {
                  container: {
                    background: palette.tooltipBackground,
                    color: palette.tooltipForeground,
                    fontSize: '12px',
                    padding: '5px',
                    borderRadius: '4px',
                    border: `1px solid ${palette.muted}`,
                  },
                },
              }}
            />
          ) : (
            <p className="py-10 text-center text-muted-foreground">
              {links.length > 0
                ? 'Preparing status flow…'
                : 'No application history data available yet.'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
})
