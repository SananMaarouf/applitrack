import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutComponent,
})

function AboutComponent () {
  return (
    <div className="text-4xl">
      <h3>About page</h3>
    </div>
  )
}

