import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({
  component: Root,
})

function Root() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster />
      <div className="p-4">
        <h1 className="text-2xl font-bold">AppliTrack</h1>
        <nav className="flex gap-3 my-4">
          <Link to="/" className="underline">Home</Link>
          <Link to="/dashboard" className="underline">Dashboard</Link>
        </nav>
        <Outlet />
      </div>
    </div>
  )
}
