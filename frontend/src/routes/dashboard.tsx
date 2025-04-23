import { createFileRoute, redirect } from "@tanstack/react-router";
import { DataTable } from "@/components/data-table";
import { useJobsStore } from '@/store/jobsStore';
import { Chart } from "@/components/PieChart";
import JobApplicationForm from "@/components/JobApplicationForm";
import { fetchData } from "@/api/crud";
import type { JobApplication } from "@/types";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async ({ location }) => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw redirect({
        to: "/auth",
        search: {
          redirect: location.href,
        },
      });
    }
    // Fetch the jobs data using the token
    const data: JobApplication[] = await fetchData();
    // Save the data to the Zustand store
    useJobsStore.getState().setJobs(data);
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <section className="flex flex-col w-screen max-w-6xl mx-auto">
      <section className="flex flex-col justify-center md:flex-row">
        <div className="w-full md:w-1/3 p-2">
          <Chart />
        </div>
        <div className="w-full md:w-1/2 p-2">
          <JobApplicationForm />
        </div>
      </section>
        <section className="flex flex-row w-full md:w-5/6 mx-auto p-2">
          <DataTable />
        </section>
    </section>
  );
}

export default RouteComponent;
