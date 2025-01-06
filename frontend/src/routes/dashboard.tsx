import { createFileRoute, redirect } from "@tanstack/react-router";
import { DataTable } from "@/components/data-table";
import { Chart } from "@/components/PieChart";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ location }) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      // Throw a redirect to the login page if the token is not present
      throw redirect({
        to: "/auth",
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
  return (
    <section className="flex flex-col items-center">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-lg">Welcome to the dashboard!</p>
      <Chart />
    </section>
  );
}

export default RouteComponent;
