import { createFileRoute } from '@tanstack/react-router'
import { ClerkLoaded, ClerkLoading, SignIn } from '@clerk/clerk-react'

export const Route = createFileRoute('/sign-in')({
  component: SignInPage,
})

function SignInPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ClerkLoading>
        <div className="text-lg">Loading sign-in...</div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignIn />
      </ClerkLoaded>
    </div>
  )
}
