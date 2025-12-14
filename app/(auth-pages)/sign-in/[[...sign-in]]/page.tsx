import { SignIn } from '@clerk/nextjs';

export const dynamic = 'force-dynamic';

export default function SignInPage() {
  return (
    <section className="flex flex-col items-center justify-center w-full max-w-md mx-auto">
      <SignIn 
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
