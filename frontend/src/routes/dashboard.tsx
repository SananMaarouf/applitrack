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
    <section className="flex flex-col w-screen max-w-6xl">
      <section className="flex flex-col md:flex-row">
        <div className="w-full md:w-1/2 p-2">
          <Chart />
        </div>
        <div className="w-full md:w-1/2 p-2">
          <JobApplicationForm />
        </div>
      </section>
      <section className="flex flex-row">
        <div className="w-full h-20"></div>
      </section>
    </section>
  );
}

export default RouteComponent;
