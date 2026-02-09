import { createFileRoute } from '@tanstack/react-router'

// Clerk's <UserProfile routing="path" path="/my-account" /> uses nested paths like
// /my-account/security. This route exists to ensure TanStack Router matches those
// subpaths so the parent /my-account route can stay mounted.
export const Route = createFileRoute('/my-account/$')({
  component: () => null,
})
