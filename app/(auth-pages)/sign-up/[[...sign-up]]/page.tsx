import { SignUp } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export default function SignUpPage() {
  return (
    <section className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      <SignUp 
        appearance={{
          elements: {
            rootBox: 'mx-auto',
            card: 'bg-card shadow-lg',
          }
        }}
      />
    </section>
  );
}
