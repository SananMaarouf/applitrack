import { createFileRoute } from '@tanstack/react-router'
import { apiFetch } from '../lib/api'

export const Route = createFileRoute('/')({
  loader: async () => {
    return apiFetch<{ status: string }>('/health')
  },
  component: Home,
})

function Home() {
  const data = Route.useLoaderData()
  return (
    <div>
      <p>API health: {data.status}</p>
      <p>
        Go to Dashboard to test reading applications/status flow. (You’ll be
        prompted to sign in with Clerk.)
      </p>
    </div>
  )
}
