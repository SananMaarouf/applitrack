import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ location }) => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      // Throw a redirect to the login page if the token is not present
      throw redirect({
        to: '/auth',
        search: {
          // Use the current location to power a redirect after login
          redirect: location.href,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Dashboard page</div>;
}

export default RouteComponent;