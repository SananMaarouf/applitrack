import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from './first-application-journey.module.css'

type FirstApplicationJourneyProps = {
  /** Called once, when the animation finishes, is skipped, or motion is reduced. */
  onComplete: () => void
  /** When true the decorative beats are omitted and the dashboard appears at once. */
  prefersReducedMotion?: boolean
  className?: string
}

const BEAT_MESSAGES = [
  'Application registered',
  'Your route is mapped',
  'First step complete',
] as const

const BEAT_DELAYS_MS = [650, 1350] as const
const TOTAL_DURATION_MS = 2100

/**
 * Three-beat, decorative first-save celebration:
 *   1. the registered document / checkpoint
 *   2. the route path and milestones
 *   3. sparkles as the regular dashboard is revealed
 *
 * All timing is cleared on unmount (including React Strict Mode's double
 * effect) and the whole sequence is over within 2.1 seconds.
 */
export function FirstApplicationJourney({
  onComplete,
  prefersReducedMotion = false,
  className,
}: FirstApplicationJourneyProps) {
  const [beat, setBeat] = useState(0)
  const onCompleteRef = useRef(onComplete)
  const completedRef = useRef(false)
  const skipButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    onCompleteRef.current = onComplete
  }, [onComplete])

  // The Radix dialog just closed, so wait one frame for its focus trap cleanup
  // before moving keyboard focus to the actual Skip control.
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      skipButtonRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [])

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onCompleteRef.current()
  }, [])

  useEffect(() => {
    if (prefersReducedMotion) {
      finish()
      return
    }

    const timers = BEAT_DELAYS_MS.map((delay, index) =>
      window.setTimeout(() => setBeat(index + 1), delay),
    )
    timers.push(window.setTimeout(finish, TOTAL_DURATION_MS))

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [prefersReducedMotion, finish])

  return (
    <section
      aria-labelledby="first-application-journey-heading"
      className={cn(
        'relative isolate mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-card px-4 py-8 text-card-foreground shadow-sm sm:px-8 sm:py-10',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="flex flex-col gap-1 text-center">
        <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          First application
        </p>
        <h2
          id="first-application-journey-heading"
          className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
        >
          You are on the board.
        </h2>
        <p className="mx-auto mt-1 max-w-lg text-sm text-muted-foreground">
          Your dashboard is getting ready with the first application included.
        </p>
      </div>

      <div className="mx-auto mt-4 w-full max-w-3xl">
        <svg
          viewBox="0 0 720 300"
          className={styles.stage}
          role="img"
          aria-label="An application document, a route with milestones, and celebratory sparkles."
        >
          <defs>
            <linearGradient id="first-application-route" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
              <stop offset="55%" stopColor="var(--primary)" stopOpacity="1" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.55" />
            </linearGradient>
          </defs>

          <g className={styles.beat} data-visible={beat >= 0}>
            <rect
              x="68"
              y="52"
              width="166"
              height="196"
              rx="18"
              fill="var(--card)"
              stroke="var(--border)"
              strokeWidth="2"
            />
            <rect
              x="92"
              y="86"
              width="84"
              height="10"
              rx="5"
              fill="var(--primary)"
              opacity="0.85"
            />
            <rect x="92" y="112" width="118" height="8" rx="4" fill="var(--muted)" />
            <rect x="92" y="134" width="98" height="8" rx="4" fill="var(--muted)" />
            <rect x="92" y="156" width="112" height="8" rx="4" fill="var(--muted)" />
            <rect x="92" y="188" width="70" height="8" rx="4" fill="var(--muted)" />
            <circle cx="224" cy="72" r="25" fill="var(--primary)" />
            <path
              d="M212 72l8 8 16-17"
              fill="none"
              stroke="var(--primary-foreground)"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          <g className={styles.beat} data-visible={beat >= 1}>
            <path
              className={styles.routePath}
              data-visible={beat >= 1}
              d="M250 170 C 320 170, 330 86, 402 86 S 500 190, 574 190 S 640 142, 672 142"
              fill="none"
              stroke="url(#first-application-route)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {[
              { x: 300, y: 152, label: 'Applied' },
              { x: 424, y: 110, label: 'Interview' },
              { x: 574, y: 190, label: 'Offer' },
            ].map((milestone, index) => (
              <g
                key={milestone.label}
                className={styles.milestone}
                data-visible={beat >= 1}
                style={{ transitionDelay: `${180 + index * 150}ms` }}
              >
                <circle
                  cx={milestone.x}
                  cy={milestone.y}
                  r="10"
                  fill="var(--card)"
                  stroke="var(--primary)"
                  strokeWidth="4"
                />
                <text
                  x={milestone.x}
                  y={milestone.y + 34}
                  textAnchor="middle"
                  className={styles.milestoneLabel}
                >
                  {milestone.label}
                </text>
              </g>
            ))}
          </g>

          <g className={styles.beat} data-visible={beat >= 2}>
            <path
              className={cn(styles.sparkle, styles.sparkleLarge)}
              data-visible={beat >= 2}
              d="M646 42l7 23 23 7-23 7-7 23-7-23-23-7 23-7z"
              fill="var(--primary)"
            />
            <path
              className={styles.sparkle}
              data-visible={beat >= 2}
              style={{ transitionDelay: '120ms' }}
              d="M590 54l4 14 14 4-14 4-4 14-4-14-14-4 14-4z"
              fill="var(--primary)"
              opacity="0.8"
            />
            <path
              className={styles.sparkle}
              data-visible={beat >= 2}
              style={{ transitionDelay: '220ms' }}
              d="M684 218l5 16 16 5-16 5-5 16-5-16-16-5 16-5z"
              fill="var(--primary)"
              opacity="0.7"
            />
            <circle
              className={styles.sparkle}
              data-visible={beat >= 2}
              style={{ transitionDelay: '300ms' }}
              cx="622"
              cy="244"
              r="5"
              fill="var(--primary)"
            />
          </g>
        </svg>
      </div>

      <div className="mt-2 flex flex-col items-center gap-4">
        <p className="sr-only" role="status" aria-live="polite">
          {BEAT_MESSAGES[beat]}
        </p>

        <ol
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label="First application journey progress"
        >
          {BEAT_MESSAGES.map((message, index) => (
            <li
              key={message}
              aria-current={index === beat ? 'step' : undefined}
              className={cn(
                'rounded-full border px-3 py-1 text-xs font-medium transition-colors motion-reduce:transition-none',
                index <= beat
                  ? 'border-primary/30 bg-accent text-foreground'
                  : 'border-border bg-surface text-muted-foreground',
              )}
            >
              {message}
            </li>
          ))}
        </ol>

        <Button
          ref={skipButtonRef}
          type="button"
          variant="outline"
          size="sm"
          onClick={finish}
        >
          Skip animation
        </Button>
      </div>
    </section>
  )
}
