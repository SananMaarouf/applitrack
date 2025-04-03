import { motion } from 'motion/react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router'


const HomeBtn = () => {
  return (
    <Link to="/">
    <p
      className="
      transition-colors duration-500
      flex rounded-2xl no-underline 
      py-3 px-3 text-2xl 
      font-bold italic text-primary
      hover:bg-card hover:text-secondary
      "
    >
      AT
      <svg
        xmlns="http://www.w3.org/2000/svg" 
        width="2rem" height="2rem" className="my-auto ml-1" viewBox="0 0 24 24"
      >
        <g fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 10c0-3.771 0-5.657 1.172-6.828S7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172S21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828S16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172S3 17.771 3 14z" />
          <path strokeLinecap="round" d="M8 12h8M8 8h8m-8 8h5" />
        </g>
      </svg>
    </p>
    </Link>
  )
};

export default HomeBtn;