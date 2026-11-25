import { forwardRef } from 'react'
import { ArrowRight, Plus } from 'lucide-react'

import { cn } from '@/lib/utils'

type FirstApplicationWelcomeProps = {
  onRegister: () => void
  className?: string
}

/**
 * First-run dashboard shown only after a successful, empty applications list.
 * The register control is intentionally a single, oversized native button so it
 * is obvious, keyboard friendly, and the only action a new user needs.
 */
export const FirstApplicationWelcome = forwardRef<
  HTMLButtonElement,
  FirstApplicationWelcomeProps
>(function FirstApplicationWelcome({ onRegister, className }, ref) {
  return (
    <section
      aria-labelledby="first-application-heading"
      className={cn(
        'relative isolate overflow-hidden rounded-2xl border border-border bg-card px-4 py-8 text-card-foreground shadow-sm sm:px-8 sm:py-12',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-24 -z-10 size-72 rounded-full bg-accent blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-32 -left-20 -z-10 size-80 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
          First application
        </span>

        <h2
          id="first-application-heading"
          className="mt-5 max-w-2xl text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl"
        >
          Your next role starts with one application.
        </h2>
        <p
          id="first-application-description"
          className="mt-4 max-w-xl text-pretty text-sm leading-relaxed text-muted-foreground sm:text-base"
        >
          Register the role you are going after. Keep the job link, key dates,
          status, and an optional PDF together from the very first step.
        </p>

        <button
          ref={ref}
          type="button"
          onClick={onRegister}
          aria-describedby="first-application-description"
          className={cn(
            'group mt-8 flex w-full max-w-2xl flex-col gap-5 rounded-2xl bg-primary p-6 text-left text-primary-foreground shadow-lg transition-[transform,background-color,box-shadow] duration-150',
            'hover:bg-primary/90 hover:shadow-xl active:translate-y-0.5 motion-reduce:transition-none sm:flex-row sm:items-center sm:justify-between sm:p-8',
            'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <span className="flex min-w-0 items-center gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-foreground/15 sm:size-14">
              <Plus className="size-7 sm:size-8" aria-hidden="true" />
            </span>
            <span className="min-w-0">
              <span className="block text-balance text-2xl leading-tight font-bold sm:text-3xl md:text-4xl">
                Register your first application
              </span>
              <span className="mt-2 block text-sm font-medium text-primary-foreground/80 sm:text-base">
                Takes about a minute. Update its status as things move forward.
              </span>
            </span>
          </span>
          <span
            className="grid size-11 shrink-0 place-items-center self-end rounded-full bg-primary-foreground text-primary shadow-sm transition-transform group-hover:translate-x-1 motion-reduce:transition-none sm:self-auto"
            aria-hidden="true"
          >
            <ArrowRight className="size-5" />
          </span>
        </button>

        <div className="mt-8 grid w-full max-w-2xl gap-3 text-left sm:grid-cols-3">
          {[
            'Keep the job link and dates together',
            'Update status as you progress',
            'Attach an optional PDF',
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-border bg-surface px-3 py-3 text-sm text-muted-foreground"
            >
              <span className="mr-2 inline-block size-1.5 rounded-full bg-primary align-middle" aria-hidden="true" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})
