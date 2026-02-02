import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/components/navbar'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <Navbar />
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  )
}
