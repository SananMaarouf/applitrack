import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import Footer from '../components/footer'
import Navbar from '../components/navbar'
import { Toaster } from '@/components/ui/toaster'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-grow mx-auto ">
        <Outlet />
      </div>
      <Footer />
      <Toaster />
      <TanStackRouterDevtools position="bottom-right" />
    </div>
  )
}