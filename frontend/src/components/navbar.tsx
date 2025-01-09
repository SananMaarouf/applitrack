import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { SquareMenu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore'
import HomeBtn from "@/components/homeBtn"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


const Navbar = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('authToken')
    setIsAuthenticated(!!token)
  }, [setIsAuthenticated])

  const handleSignOut = () => {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authData')
    setIsAuthenticated(false)
    navigate({ to: '/' })
  }

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="w-full md:w-2/3 mx-auto h-20 content-center"
    >
      <div className="flex justify-between px-2 md:px-9">
        <Link to="/" className="rounded-md text-sm font-medium">
          <HomeBtn />
        </Link>

        {/* Conditionals for authenticated users */}
        {isAuthenticated ? (
          location.pathname === '/' ? (
            <motion.div className='my-auto' whileHover={{ scale: 0.95 }}>
              <Link to="/dashboard"
                className=" py-3 px-3 text-md bg-card font-bold flex rounded-lg no-underline border hover:border-white"
              >
                Dashboard
              </Link>
            </motion.div>
          ) : (
            <motion.div className='my-auto' whileHover={{ scale: 0.95 }}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild
                className="p-1 my-auto border rounded-md bg-card hover:border-white transition-all duration-500">
                <SquareMenu color='white' size={52} />
              </DropdownMenuTrigger>
              <DropdownMenuContent className='bg-card'>
                <Link
                  to='/dashboard'
                  className="w-full flex border border-transparent rounded-sm py-1 px-2 text-lg hover:bg-card hover:border-gray-500 transition-all duration-300"
                >
                  Dashboard
                </Link>
                <DropdownMenuSeparator />
                <Link
                  to='/dashboard'
                  className="w-full flex border border-transparent rounded-sm py-1 px-2 text-lg hover:bg-card hover:border-gray-500 transition-all duration-300"
                >
                  Profile
                </Link>
                <DropdownMenuSeparator />
                <Link
                  to='/tos'
                  className="w-full flex border border-transparent rounded-sm py-1 px-2 text-lg hover:bg-card hover:border-gray-500 transition-all duration-300"
                >
                  Privacy
                </Link>
                <DropdownMenuSeparator />
                <button onClick={handleSignOut} className="w-full flex rounded-sm py-1 px-2 text-lg hover:bg-red-900 transition-all duration-300"
                >
                  Sign out
                </button>
              </DropdownMenuContent>
            </DropdownMenu>
            </motion.div>

          )
        ) : (
          <motion.div className='my-auto' whileHover={{ scale: 1.1 }}>
            <Link to="/auth"
              className=" py-3 px-3 mr-2 md:mr-0 text-md bg-card font-bold flex rounded-lg no-underline border hover:border-white"
            >
              Login / Register
            </Link>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}

export default Navbar