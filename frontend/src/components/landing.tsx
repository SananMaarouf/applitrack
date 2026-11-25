import { Link } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";

import { LandingStatusFlow } from "./landing-status-flow";
import { Button } from "./ui/button";

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
          <LandingStatusFlow />
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
