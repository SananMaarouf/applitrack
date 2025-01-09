import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '@/store/authStore'
import { useEffect } from 'react'
export const Route = createFileRoute('/profile')({
  beforeLoad: async ({ location }) => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      throw redirect({
        to: '/auth',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
    const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated)
    const navigate = useNavigate()

    useEffect(() => {
      const token = localStorage.getItem('authToken')
      const userdata = localStorage.getItem('authData')
      console.log(userdata)
      setIsAuthenticated(!!token)
    }, [setIsAuthenticated])
    
    const handleSignOut = () => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('authData')
      setIsAuthenticated(false)
      navigate({ to: '/' })
    }


  return (
    <section className="flex flex-col w-screen max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold text-center">Profile</h1>
      
    </section>
  );
}
