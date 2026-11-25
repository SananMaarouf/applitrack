import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { useMediaQuery } from "@/hooks/use-media-query";
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

function DashboardPreview() {
  // Keep the vertical flow on tablets, including wide touch-first iPads, and
  // switch to horizontal only on desktop-sized fine-pointer screens. This
  // matches Tailwind's `xl` breakpoint plus an explicit fine-pointer check.
  const isDesktopHorizontal = useMediaQuery(
    "(min-width: 80rem) and (pointer: fine)",
  );

  return (
    <SankeyDiagram
      data={sampleStatusFlow}
      layout={isDesktopHorizontal ? "horizontal" : "vertical"}
      heightClassName="min-h-[18rem] rounded-lg text-foreground sm:min-h-[28rem] md:h-80 md:min-h-0 lg:h-auto lg:min-h-80"
      transparentBackground
      ariaLabel="Sample status flow. Applied 22: Interview 12, Rejected 6, Ghosted 4. Interview 12: Second Interview 6, Rejected 4, Ghosted 2. Second Interview 6: Offer 3, Rejected 3."
    />
  );
}

export function Landing() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid w-full max-w-7xl min-w-0 gap-y-6 px-4 pb-8 pt-6 sm:gap-y-8 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.02fr_0.98fr] lg:gap-x-16 lg:gap-y-0 lg:pb-24 lg:pt-20">
        <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:self-end">
          <h1 className="max-w-3xl font-serif text-4xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl xl:text-7xl">
            Stay on track with <span className="text-primary">Applitrack</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Track applications, interviews, offers, rejections, and ghosted leads in one
            organised workspace. Keep the company, role, job link, status, and timeline for
            every opportunity together, so you always know what to follow up on next.
          </p>
        </div>

        <div className="min-w-0 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:grid lg:self-stretch">
          <DashboardPreview />
        </div>

        <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:self-start">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:mt-8">
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

          <ul className="mt-6 hidden flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground sm:flex">
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
      </div>
    </section>
  );
}
