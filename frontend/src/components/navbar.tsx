import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { motion } from "framer-motion";
import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';

const Navbar = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setIsAuthenticated = useAuthStore((state) => state.setIsAuthenticated);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, [setIsAuthenticated]);

  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authData');
    setIsAuthenticated(false);

    navigate({ to: '/' });
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="w-full h-20 content-center">
      <div className="w-full md:w-3/4 md:mx-auto flex justify-between px-4">
        <Link to="/" className="hover:bg-foreground hover:text-background px-3 py-2 rounded-md text-sm font-medium">
          Home
        </Link>

        {isAuthenticated ? (
          location.pathname === '/' ? (
            <Link to="/dashboard" className="hover:bg-foreground hover:text-background px-3 py-2 rounded-md text-sm font-medium">
              Dashboard
            </Link>
          ) : (
            <button onClick={handleSignOut} className="hover:bg-foreground hover:text-background px-3 py-2 rounded-md text-sm font-medium">
              Sign Out
            </button>
          )
        ) : (
          <Link to="/auth" className="hover:bg-foreground hover:text-background px-3 py-2 rounded-md text-sm font-medium">
            Login / Register
          </Link>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;