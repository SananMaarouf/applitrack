import { useEffect } from 'react'
import { Link, Navigate, createFileRoute, useLocation } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'
import { ArrowRight } from 'lucide-react'

import { Landing } from '../components/landing'
import { Features, HowItWorks, SiteFooter } from '../components/features'
import { Celebrate } from '../components/celebrate'
import { Button } from '../components/ui/button'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const { isLoaded, userId } = useAuth()
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const id = hash.replace(/^#/, '')
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash])

  if (isLoaded && userId) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-w-0 flex-col overflow-x-clip">
      <Landing />
      <Features />
      <HowItWorks />

      <section className="border-b border-border/70 bg-card/50 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Ready when you are
            </p>
            <h2 className="mt-3 max-w-xl font-serif text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Give every application a clear next step.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground">
              Bring your applications into one organised workspace and keep the status of each
              opportunity current. Start free, then move at your own pace.
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
                <Link to="/sign-in">Log in</Link>
              </Button>
            </div>
          </div>
          <div className="flex min-w-0 justify-center lg:justify-end">
            <Celebrate className="w-full max-w-sm" />
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
