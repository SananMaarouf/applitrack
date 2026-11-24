import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  CircleDotDashed,
  ListFilter,
  Sparkles,
} from "lucide-react";

import { ThemeSwitcher } from "@/components/theme-switcher";
import { JOB_STATUS_OPTIONS } from "@/lib/job-status-ui";
import { cn } from "@/lib/utils";

const chartBars = [42, 68, 54, 82, 61, 90, 73, 58, 84, 66];

const tableRows = [
  { company: "Northwind Studio", role: "Product Designer", status: "Interview", dot: "bg-chart-2" },
  { company: "Fieldnote Labs", role: "Frontend Engineer", status: "Applied", dot: "bg-chart-1" },
  { company: "Juniper & Co.", role: "UX Researcher", status: "Offer", dot: "bg-chart-5" },
];

const steps = [
  {
    title: "Log applications",
    description:
      "Record the company, role, job link, and application date for each opportunity in one place.",
  },
  {
    title: "Track interviews & statuses",
    description:
      "Update each application's status as you move through interviews, and keep the follow-up for the next step visible.",
  },
  {
    title: "Spot trends and work toward an offer",
    description:
      "Use the dashboard analytics to read your pipeline, status flow, and interview momentum, then focus on the applications that can move forward.",
  },
] as const;

function SectionIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function BentoCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6",
        className,
      )}
    >
      {children}
    </article>
  );
}

function CardHeading({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <span className="grid size-10 shrink-0 place-items-center rounded-[8px] border border-border bg-muted/60 text-primary">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{children}</p>
    </>
  );
}

export function Features() {
  return (
    <section id="features" className="scroll-mt-20 border-b border-border/70 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <SectionIntro
          eyebrow="Features"
          title="A clearer view of every moving part"
          description="Applitrack keeps the details of your job search readable: what you applied to, where each application stands, and how the search is trending over time."
        />

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <BentoCard className="sm:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-md">
                <CardHeading icon={CalendarDays} title="Every application, complete in one record">
                  Keep the position, company, applied date, and job link together, plus an
                  optional expiry date and PDF attachment. The saved record stays complete when
                  you come back to it.
                </CardHeading>
              </div>
              <div className="w-full max-w-xs rounded-lg border border-border bg-background p-3 sm:w-auto sm:min-w-64">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Saved application record
                </p>
                <dl className="mt-3 space-y-2.5">
                  {[
                    { label: "Position", value: "Product Designer" },
                    { label: "Company", value: "Northwind Studio" },
                    { label: "Applied", value: "18 Nov 2026" },
                    { label: "Job link", value: "northwind.example/job" },
                    { label: "Expires (optional)", value: "2 Dec 2026" },
                    { label: "Attachment (optional)", value: "portfolio.pdf" },
                  ].map((field) => (
                    <div key={field.label} className="flex items-baseline justify-between gap-3">
                      <dt className="shrink-0 text-[11px] text-muted-foreground">{field.label}</dt>
                      <dd className="min-w-0 truncate text-right text-[11px] font-medium text-foreground">
                        {field.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </BentoCard>

          <BentoCard>
            <CardHeading icon={CircleDotDashed} title="Seven statuses, clearly labelled">
              Move an application from applied through interview rounds to an offer, rejection,
              or ghosted — without losing the history.
            </CardHeading>
            <ul className="mt-5 flex flex-wrap gap-1.5">
              {JOB_STATUS_OPTIONS.map((status) => (
                <li
                  key={status.key}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium"
                  style={{
                    backgroundColor: `var(--status-${status.key}-bg)`,
                    color: `var(--status-${status.key}-fg)`,
                  }}
                >
                  <span
                    className="size-1.5 rounded-full"
                    style={{ backgroundColor: status.color }}
                    aria-hidden="true"
                  />
                  {status.label}
                </li>
              ))}
            </ul>
          </BentoCard>

          <BentoCard>
            <CardHeading icon={ChartNoAxesColumnIncreasing} title="Trends and status flow">
              Review applications over time, interview momentum, and where applications tend to
              end up with the dashboard charts.
            </CardHeading>
            <div className="mt-5 flex h-24 items-end gap-1.5" aria-hidden="true">
              {chartBars.map((height, index) => (
                <span
                  key={index}
                  className={cn(
                    "flex-1 rounded-sm",
                    index === chartBars.length - 2 ? "bg-primary" : "bg-primary/20",
                  )}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </BentoCard>

          <BentoCard className="sm:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-md">
                <CardHeading icon={ListFilter} title="Find and update in place">
                  Search, sort, and filter your applications in the data table, then update a
                  status or remove a record without leaving the page. Export the status flow when
                  you want a copy.
                </CardHeading>
              </div>
              <div className="w-full space-y-1.5 rounded-lg border border-border bg-background p-3 sm:w-64">
                {tableRows.map((row) => (
                  <div key={row.company} className="flex items-center gap-2 rounded-md border border-border bg-card px-2 py-1.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-[10px] font-semibold text-muted-foreground">
                      {row.company.slice(0, 1)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-medium text-foreground">{row.company}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{row.role}</span>
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">
                      <span className={`size-1.5 rounded-full ${row.dot}`} aria-hidden="true" />
                      {row.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-border/70 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <SectionIntro
          eyebrow="How it works"
          title="Three steps from first application to clear next move"
          description="Log each opportunity, keep its status and follow-up current, and use the dashboard to see how the search is trending."
        />

        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="relative flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <span className="font-serif text-4xl font-semibold leading-none text-primary/30" aria-hidden="true">
                0{index + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                <span className="sr-only">Step {index + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              {index < steps.length - 1 && (
                <ArrowRight className="absolute -right-2.5 top-1/2 hidden size-5 -translate-y-1/2 text-border md:block" aria-hidden="true" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FooterMark() {
  return (
    <span className="flex items-center gap-2 text-lg font-bold italic text-foreground">
      Applitrack
      <svg
        width="26"
        height="26"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="40" height="40" rx="9" fill="var(--primary)" />
        <line x1="14" y1="16" x2="34" y2="16" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="24" x2="34" y2="24" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" />
        <line x1="14" y1="32" x2="30" y2="32" stroke="var(--primary-foreground)" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </span>
  );
}

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-muted/40">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <FooterMark />
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A focused job application tracker for the whole search: every status, every
            interview round, and every next step in one workspace.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Theme
            </span>
            <ThemeSwitcher variant="icon-only" />
          </div>
        </div>

        <nav aria-label="Landing page sections">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Explore</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href="#features" className="text-muted-foreground transition-colors hover:text-foreground">
                Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="text-muted-foreground transition-colors hover:text-foreground">
                How It Works
              </a>
            </li>
            <li>
              <Link to="/terms-of-service" search={{ from: undefined }} className="text-muted-foreground transition-colors hover:text-foreground">
                Terms of Service
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Account">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Account</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/sign-in" className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
                <Sparkles className="size-3.5" /> Log in
              </Link>
            </li>
            <li>
              <Link to="/sign-up" className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground">
                <ArrowRight className="size-3.5" /> Start tracking
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      <div className="border-t border-border/70">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {year} Applitrack. All rights reserved.</p>
          <Link to="/terms-of-service" search={{ from: undefined }} className="transition-colors hover:text-foreground">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
