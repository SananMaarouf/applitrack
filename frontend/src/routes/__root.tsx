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
      <SidebarProvider defaultOpen className="md:flex-row-reverse">
        <Toaster />
        <AppSidebar />
        <SidebarInset className="min-h-screen">
          <Navbar />
          <main className="flex-1 p-4 pb-20 md:pb-4">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <Navbar />
      <main className="p-4 pb-20 md:pb-4">
        <Outlet />
      </main>
    </div>
  )
}

function NotFound() {
  return (
    <div className="text-center mt-12">
      <img 
        src="/confused_travolta.gif" 
        width={300} 
        height={300} 
        alt="404 gif"
        className="mx-auto"
      />
      <h1 className="mt-6 text-xl">404 - Page not found</h1>
      <Button asChild className="mt-6">
        <Link to="/dashboard">Go back home</Link>
      </Button>
    </div>
  )
}
