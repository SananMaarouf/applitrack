import { createFileRoute } from '@tanstack/react-router'
import { ClerkLoaded, ClerkLoading, SignUp } from '@clerk/clerk-react'

export const Route = createFileRoute('/sign-up')({
  component: SignUpPage,
})

function SignUpPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ClerkLoading>
        <div className="text-lg ">Loading sign-up...</div>
      </ClerkLoading>
      <ClerkLoaded>
        <SignUp />
      </ClerkLoaded>
    </div>
  )
}
