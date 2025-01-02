import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/authpage')({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className='text-4xl'>Auth page</div>
  )
}
