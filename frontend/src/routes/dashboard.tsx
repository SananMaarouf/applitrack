import { createFileRoute, redirect } from "@tanstack/react-router";
import { DataTable } from "@/components/data-table";
import { Chart } from "@/components/PieChart";
import JobApplicationForm from "@/components/JobApplicationForm";

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
    <section className="flex flex-col w-screen max-w-6xl border ">
        <Chart />
        <JobApplicationForm />
    </section>
  );
}

export default RouteComponent;
