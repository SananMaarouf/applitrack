import { Link } from '@tanstack/react-router';
import { motion, animate, transform, } from "framer-motion";

const Navbar = () => {
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className=" w-full h-20 content-center">
      <div className="w-full md:w-3/4 md:mx-auto flex justify-between px-4">
          <Link to="/" className="hover:bg-foreground hover:text-background px-3 py-2 rounded-md text-sm font-medium">
            Home
          </Link>

          <Link to="/auth" className=" hover:bg-foreground hover:text-background px-3 py-2 rounded-md text-sm font-medium">
            Login / Register
          </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;