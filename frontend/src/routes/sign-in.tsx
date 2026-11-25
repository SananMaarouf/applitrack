import { createFileRoute } from '@tanstack/react-router'
import { ClerkLoaded, ClerkLoading, SignIn } from '@clerk/clerk-react'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
      <ClerkLoading>
        <div className="text-lg">Loading sign-in...</div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn />
      </ClerkLoaded>
    </div>
  )
}
