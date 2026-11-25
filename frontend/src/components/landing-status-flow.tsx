import { useMediaQuery } from "@/hooks/use-media-query";
import { JOB_STATUS_UI } from "@/lib/job-status-ui";
import { JobStatus } from "@/types/jobStatus";

type StatusLabel =
  | "Applied"
  | "Interview"
  | "Second Interview"
  | "Offer"
  | "Rejected"
  | "Ghosted";

type StatusFlow = {
  from: StatusLabel;
  to: StatusLabel;
  weight: number;
};

type NodeLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  labelX: number;
  labelY: number;
  labelAnchor: "start" | "middle" | "end";
};

type FlowPath = {
  from: StatusLabel;
  to: StatusLabel;
  weight: number;
  d: string;
};

type FlowLayout = {
  viewBox: string;
  nodes: Record<StatusLabel, NodeLayout>;
  flows: readonly FlowPath[];
  labelFontSize: number;
  orientation: "horizontal" | "vertical";
};

const STATUS_COLOR: Record<StatusLabel, string> = {
  Applied: JOB_STATUS_UI[JobStatus.APPLIED].color,
  Interview: JOB_STATUS_UI[JobStatus.INTERVIEW].color,
  "Second Interview": JOB_STATUS_UI[JobStatus.SECOND_INTERVIEW].color,
  Offer: JOB_STATUS_UI[JobStatus.OFFER].color,
  Rejected: JOB_STATUS_UI[JobStatus.REJECTED].color,
  Ghosted: JOB_STATUS_UI[JobStatus.GHOSTED].color,
};

const STATUS_LABELS = Object.keys(STATUS_COLOR) as StatusLabel[];

const SAMPLE_STATUS_FLOW: readonly StatusFlow[] = [
  { from: "Applied", to: "Interview", weight: 12 },
  { from: "Applied", to: "Rejected", weight: 6 },
  { from: "Applied", to: "Ghosted", weight: 4 },
  { from: "Interview", to: "Second Interview", weight: 6 },
  { from: "Interview", to: "Rejected", weight: 4 },
  { from: "Interview", to: "Ghosted", weight: 2 },
  { from: "Second Interview", to: "Offer", weight: 3 },
  { from: "Second Interview", to: "Rejected", weight: 3 },
];

const ARIA_LABEL =
  "Sample status flow. Applied 22: Interview 12, Rejected 6, Ghosted 4. Interview 12: Second Interview 6, Rejected 4, Ghosted 2. Second Interview 6: Offer 3, Rejected 3.";

const DESKTOP_QUERY = "(min-width: 64rem)";
const TABLET_QUERY = "(min-width: 48rem)";

/**
 * Spread a node's flows across the edge they share, proportional to weight.
 * This keeps ribbon endpoints distinct instead of collapsing every path onto
 * the node's centre point.
 */
function edgeOffsets(
  flows: readonly StatusFlow[],
  edgeLength: number,
): Map<StatusFlow, number> {
  const offsets = new Map<StatusFlow, number>();
  if (flows.length === 0) return offsets;

  const padding = Math.min(8, edgeLength * 0.2);
  const usable = Math.max(1, edgeLength - padding * 2);
  const totalWeight = flows.reduce((total, flow) => total + flow.weight, 0);

  let cursor = padding;
  for (const flow of flows) {
    const span = usable * (flow.weight / totalWeight);
    offsets.set(flow, cursor + span / 2);
    cursor += span;
  }

  return offsets;
}

function createLayout(
  nodes: Record<StatusLabel, NodeLayout>,
  viewBox: string,
  orientation: FlowLayout["orientation"],
  labelFontSize: number,
): FlowLayout {
  const outgoing = new Map<StatusLabel, StatusFlow[]>();
  const incoming = new Map<StatusLabel, StatusFlow[]>();

  for (const flow of SAMPLE_STATUS_FLOW) {
    outgoing.set(flow.from, [...(outgoing.get(flow.from) ?? []), flow]);
    incoming.set(flow.to, [...(incoming.get(flow.to) ?? []), flow]);
  }

  const sourceOffsets = new Map<StatusLabel, Map<StatusFlow, number>>();
  const targetOffsets = new Map<StatusLabel, Map<StatusFlow, number>>();

  for (const label of STATUS_LABELS) {
    const node = nodes[label];
    const edgeLength =
      orientation === "horizontal" ? node.height : node.width;
    sourceOffsets.set(
      label,
      edgeOffsets(outgoing.get(label) ?? [], edgeLength),
    );
    targetOffsets.set(
      label,
      edgeOffsets(incoming.get(label) ?? [], edgeLength),
    );
  }

  const flows = SAMPLE_STATUS_FLOW.map((flow) => {
    const source = nodes[flow.from];
    const target = nodes[flow.to];
    const sourceOffset = sourceOffsets.get(flow.from)?.get(flow);
    const targetOffset = targetOffsets.get(flow.to)?.get(flow);

    if (sourceOffset === undefined || targetOffset === undefined) {
      throw new Error(`Missing status flow geometry for ${flow.from} → ${flow.to}`);
    }

    if (orientation === "horizontal") {
      const sx = source.x + source.width;
      const sy = source.y + sourceOffset;
      const tx = target.x;
      const ty = target.y + targetOffset;
      const handle = Math.max(24, Math.abs(tx - sx) * 0.45);

      return {
        ...flow,
        d: `M ${sx} ${sy} C ${sx + handle} ${sy}, ${tx - handle} ${ty}, ${tx} ${ty}`,
      };
    }

    const sx = source.x + sourceOffset;
    const sy = source.y + source.height;
    const tx = target.x + targetOffset;
    const ty = target.y;
    const handle = Math.max(24, Math.abs(ty - sy) * 0.5);

    return {
      ...flow,
      d: `M ${sx} ${sy} C ${sx} ${sy + handle}, ${tx} ${ty - handle}, ${tx} ${ty}`,
    };
  });

  return { viewBox, nodes, flows, labelFontSize, orientation };
}

function horizontalNode(
  x: number,
  y: number,
  width = 14,
  height = 42,
): NodeLayout {
  return {
    x,
    y,
    width,
    height,
    labelX: x + width + 10,
    labelY: y + height / 2 + 5,
    labelAnchor: "start",
  };
}

function verticalNode(x: number, y: number): NodeLayout {
  const width = 96;
  const height = 12;

  return {
    x,
    y,
    width,
    height,
    labelX: x + width / 2,
    labelY: y - 8,
    labelAnchor: "middle",
  };
}

// Phone: compact top-to-bottom stages, with all downstream statuses below the
// Second Interview stage so every ribbon flows forward.
const PHONE = createLayout(
  {
    Applied: verticalNode(132, 24),
    Interview: verticalNode(132, 84),
    "Second Interview": verticalNode(132, 144),
    Ghosted: verticalNode(24, 230),
    Offer: verticalNode(132, 230),
    Rejected: verticalNode(240, 230),
  },
  "0 0 360 270",
  "vertical",
  13,
);

// Tablet: single-column hero at ~955px, so the art can run wide.
const TABLET = createLayout(
  {
    Applied: horizontalNode(28, 110),
    Interview: horizontalNode(230, 110),
    "Second Interview": horizontalNode(432, 110),
    Ghosted: horizontalNode(650, 220),
    Offer: horizontalNode(650, 50),
    Rejected: horizontalNode(650, 170),
  },
  "0 0 900 320",
  "horizontal",
  14,
);

// Desktop: narrower right-hand hero column (roughly 450–570px). The 500×300
// viewBox keeps labels around 13–15px instead of shrinking to ~10px.
const DESKTOP = createLayout(
  {
    Applied: horizontalNode(14, 105),
    Interview: horizontalNode(104, 105),
    "Second Interview": horizontalNode(214, 105),
    Ghosted: horizontalNode(372, 215),
    Offer: horizontalNode(372, 35),
    Rejected: horizontalNode(372, 165),
  },
  "0 0 500 300",
  "horizontal",
  14,
);

/**
 * Static, dependency-free stand-in for the dashboard Sankey chart on the public
 * landing page. Geometry is computed once at module load, so first paint never
 * waits for chart layout, ResizeObserver measurement, animations, or palette
 * resolution in JavaScript. Colours stay on the shared status CSS tokens.
 */
export function LandingStatusFlow() {
  // Breakpoints match the hero's layout: full-width until the lg two-column
  // grid, then the narrower desktop column. Only boolean media queries run;
  // there is no element measurement.
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isTablet = useMediaQuery(TABLET_QUERY);
  const layout = isDesktop ? DESKTOP : isTablet ? TABLET : PHONE;

  return (
    <svg
      role="img"
      aria-label={ARIA_LABEL}
      viewBox={layout.viewBox}
      preserveAspectRatio="xMidYMid meet"
      className="mx-auto block h-[18rem] w-full max-w-full md:h-[20rem]"
      fill="none"
    >
      {/* Flows are painted first so the node bars mask any crossings. */}
      <g aria-hidden="true">
        {layout.flows.map((flow) => (
          <path
            key={`${flow.from}-${flow.to}`}
            d={flow.d}
            data-flow="true"
            data-from={flow.from}
            data-to={flow.to}
            data-weight={flow.weight}
            stroke={STATUS_COLOR[flow.from]}
            strokeWidth={2 + flow.weight * 0.9}
            strokeLinecap="round"
            strokeOpacity={0.55}
          />
        ))}
      </g>

      <g>
        {STATUS_LABELS.map((label) => {
          const node = layout.nodes[label];

          return (
            <g key={label} data-status={label}>
              <rect
                x={node.x}
                y={node.y}
                width={node.width}
                height={node.height}
                rx={4}
                fill={STATUS_COLOR[label]}
              />
              <text
                x={node.labelX}
                y={node.labelY}
                textAnchor={node.labelAnchor}
                fontSize={layout.labelFontSize}
                fontWeight={600}
                fill="var(--text-primary)"
                stroke="var(--background)"
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
              >
                {label}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
