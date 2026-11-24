import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { JOB_STATUS_UI } from "@/lib/job-status-ui";
import { JobStatus } from "@/types/jobStatus";
import type { SankeyFlowItem } from "./sankey-diagram";
import { SankeyDiagram } from "./sankey-diagram";
import { Button } from "./ui/button";

// Read-only fixture values only: the preview reuses the dashboard's shared
// Sankey renderer, theme palette, and status names/order.
const sampleStatusFlow: readonly SankeyFlowItem[] = [
  { from: "Applied", to: "Interview", weight: 12 },
  { from: "Applied", to: "Rejected", weight: 6 },
  { from: "Applied", to: "Ghosted", weight: 4 },
  { from: "Interview", to: "Second Interview", weight: 6 },
  { from: "Interview", to: "Rejected", weight: 4 },
  { from: "Interview", to: "Ghosted", weight: 2 },
  { from: "Second Interview", to: "Offer", weight: 3 },
  { from: "Second Interview", to: "Rejected", weight: 3 },
];

const sampleStatusTotals = [
  { status: JobStatus.APPLIED, count: 22 },
  { status: JobStatus.INTERVIEW, count: 12 },
  { status: JobStatus.SECOND_INTERVIEW, count: 6 },
  { status: JobStatus.OFFER, count: 3 },
  { status: JobStatus.REJECTED, count: 13 },
  { status: JobStatus.GHOSTED, count: 6 },
] as const;

function DashboardPreview() {
  return (
    <figure
      aria-labelledby="dashboard-preview-title"
      className="relative min-w-0 rounded-xl border border-border bg-card p-3 shadow-xl sm:p-4"
    >
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
        <span
          id="dashboard-preview-title"
          className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground"
        >
          Status flow
        </span>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
          Sample data
        </span>
      </figcaption>

      <div className="mt-4 min-w-0">
        <SankeyDiagram
          data={sampleStatusFlow}
          layout="vertical"
          heightClassName="min-h-[26rem] rounded-lg bg-surface text-foreground sm:min-h-[28rem] md:h-80 md:min-h-0"
          ariaLabel="Sample status flow. Applied 22: Interview 12, Rejected 6, Ghosted 4. Interview 12: Second Interview 6, Rejected 4, Ghosted 2. Second Interview 6: Offer 3, Rejected 3."
        />
      </div>

      <dl
        aria-label="Sample status totals"
        className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] sm:grid-cols-3"
      >
        {sampleStatusTotals.map(({ status, count }) => {
          const { label, color } = JOB_STATUS_UI[status];
          return (
            <div key={status} className="flex min-w-0 items-center justify-between gap-2">
              <dt className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="truncate">{label}</span>
              </dt>
              <dd className="font-semibold text-foreground">{count}</dd>
            </div>
          );
        })}
      </dl>

      <p className="mt-4 text-center text-[10px] text-muted-foreground">
        Illustrative flow only — not your application data.
      </p>
    </figure>
  );
}

export function Landing() {
  return (
    <section className="relative overflow-hidden border-b border-border/70">
      <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl min-w-0 gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-20">
        <div className="min-w-0">
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
            Stay on track with <span className="text-primary">Applitrack</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Track applications, interviews, offers, rejections, and ghosted leads in one
            organised workspace. Keep the company, role, job link, status, and timeline for
            every opportunity together, so you always know what to follow up on next.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button asChild size="lg" className="h-12 rounded-[8px] px-6 text-base">
              <Link to="/sign-up">
                Start tracking for free
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 rounded-[8px] border-border bg-background px-6 text-base"
            >
              <a href="#how-it-works">See how it works</a>
            </Button>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <li className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-primary" /> Free to start
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-primary" /> Seven clear statuses
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Check className="size-4 text-primary" /> Works on every screen
            </li>
          </ul>
        </div>

        <div className="min-w-0">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
