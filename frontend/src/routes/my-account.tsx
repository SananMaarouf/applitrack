import { createFileRoute, Navigate } from '@tanstack/react-router'
import { UserProfile, useAuth } from '@clerk/clerk-react'

export const Route = createFileRoute('/my-account')({
  component: MyAccount,
})

function MyAccount() {
  const { isLoaded, userId } = useAuth()

  if (!isLoaded) return <div>Loading...</div>
  if (!userId) return <Navigate to={'/sign-in' as any} />

  return (
    <div className="mx-auto max-w-4xl">
      <UserProfile routing="path" path="/my-account" />
    </div>
  )
}
