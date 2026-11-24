import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import { useAuth } from '@clerk/clerk-react'

import { AppSidebar } from '@/components/app-sidebar'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: NotFound,
})

function Root() {
  const { isLoaded, userId } = useAuth()

  if (isLoaded && userId) {
    return (
      <SidebarProvider defaultOpen className="min-h-svh">
        <Toaster />
        <AppSidebar />
        <SidebarInset className="min-h-svh min-w-0">
          <Navbar />
          <main className="min-w-0 flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-8 md:pt-6">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <Toaster />
      <Navbar />
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}

function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center">
      <img
        src="/confused_travolta.gif"
        width={300}
        height={300}
        alt=""
        className="mx-auto"
      />
      <h1 className="mt-6 font-serif text-2xl font-semibold">404 — Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you were looking for is no longer here.
      </p>
      <Button asChild className="mt-6 rounded-[8px]">
        <Link to="/dashboard">Go back home</Link>
      </Button>
    </div>
  )
}
