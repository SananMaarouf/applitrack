import { Outlet, createRootRoute, Link } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'

export const Route = createRootRoute({
  component: Root,
  notFoundComponent: NotFound,
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
