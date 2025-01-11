import { createFileRoute } from '@tanstack/react-router'
import { motion } from 'motion/react'
import { Link } from '@tanstack/react-router'
export const Route = createFileRoute('/404')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='
    items-center justify-center
    flex flex-col w-full 
    mx-auto text-center gap-7'>
      <h1 className='text-6xl font-bold'>404</h1>
      <h2 className='text-4xl md:text-5xl font-bold transition-all duration-500'>We’re as lost as you are.</h2>
      <Link to="/" className='
        text-3xl  
        border-white bg-card border py-3 px-4 
        hover:bg-white hover:text-black
        rounded-full hover:scale-110 duration-500 transition-all
        '>
        Let's go home
      </Link>
    </div>
  );
}
