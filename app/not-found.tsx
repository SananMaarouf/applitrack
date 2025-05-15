import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <Image 
        src={"/confused_travolta.gif"} 
        width={300} 
        height={300} 
        alt='404 gif'
        className='mx-auto'></Image>
      <h1 className='mt-6 text-xl'>404 - Page not found</h1>
     <Button asChild className='mt-6'>
          <Link href='/dashboard'>Go back home</Link>
      </Button>
    </div>
  );
}