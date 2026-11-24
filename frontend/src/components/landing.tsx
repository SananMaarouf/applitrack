import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import type { DashboardTrends } from "@/types/jobApplication";
import { TrendCards } from "./trendCards";
import { Button } from "./ui/button";

// Fixture values only: the preview reuses the dashboard's shared TrendCards
// component so the layout and states stay accurate.
const previewTrends: DashboardTrends = {
  period: "week",
  ranges: {
    current_start: "2026-11-17T00:00:00.000Z",
    current_end: "2026-11-24T00:00:00.000Z",
    previous_start: "2026-11-10T00:00:00.000Z",
    previous_end: "2026-11-17T00:00:00.000Z",
  },
  applications_sent: {
    current: 12,
    previous: 8,
    difference: 4,
    percentChange: 50,
    direction: "up",
  },
  interviews: {
    current: 3,
    previous: 4,
    difference: -1,
    percentChange: -25,
    direction: "down",
  },
};

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
          Dashboard overview · Sample data
        </span>
        <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          Read-only
        </span>
      </figcaption>

      <div className="mt-4 min-w-0">
        <TrendCards trends={previewTrends} period="week" isLoading={false} />
      </div>

      <p className="mt-3 text-center text-[10px] text-muted-foreground">
        Sample values shown with the shared dashboard trend cards.
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
