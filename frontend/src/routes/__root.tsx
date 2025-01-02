import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import Footer from '../components/footer'
import Navbar from '../components/navbar'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  return (
    <>
      <Navbar />
      {/* children */}
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
      <Footer />
    </>
  )
}
