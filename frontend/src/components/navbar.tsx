import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { useEffect } from 'react'
import { SquareMenu } from 'lucide-react';
import { useAuthStore } from '@/store/authStore'
import HomeBtn from "@/components/homeBtn"
import ThemeSwitcher from "@/components/themeSwitcher"
import {
  DropdownMenu,
  DropdownMenuContent,
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
      className="w-full mx-auto lg:w-10/12 h-20 content-center"
    >
      <div className="flex justify-between px-1 lg:px-0">
        <HomeBtn />
        <div className='flex items-center gap-1'>
          <ThemeSwitcher />
          {/* Conditionals for authenticated users */}
          {isAuthenticated ? (
            location.pathname === '/' ? (
              <div className='my-auto hover:scale-95'>
                <Link to="/dashboard"
                  className="
                    py-3 px-3 text-md bg-card font-bold flex rounded-lg no-underline border hover:border-white"
                >
                  Dashboard
                </Link>
              </div>
            ) : (
              <div className='my-auto duration-300' >
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
                    to='/account'
                    className="w-full flex border border-transparent rounded-sm py-1 px-2 text-lg hover:bg-card hover:border-gray-500 transition-all duration-300"
                  >
                    Account
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
              </div>
            )
          ) : (
            <div className='my-auto'>
              <Link to="/auth" className="
                p-3 text-md bg-card
                font-bold flex rounded-full 
                no-underline transition-colors duration-500
                hover:bg-card-foreground
                "
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>

    </motion.nav>
  )
}

export default Navbar