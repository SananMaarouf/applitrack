import { createFileRoute, redirect } from "@tanstack/react-router";
import { DataTable } from "@/components/data-table";
import { useJobsStore } from '@/store/jobsStore';
import { Chart } from "@/components/PieChart";
import JobApplicationForm from "@/components/JobApplicationForm";
import { columns } from "@/components/columns";
import { fetchData } from "@/api/crud";

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
    const data = await fetchData();
    console.log("data fresh from fetchdata in dashboard",data)

    // Save the data to the Zustand store (replace setJobs with your own action)
    useJobsStore.getState().setJobs(data);
  },
  component: RouteComponent,
});

function RouteComponent() {
  const jobApplications = useJobsStore((state) => state.jobApplications);
  console.log(jobApplications);
  return (
    <section className="flex flex-col w-screen max-w-6xl">
      <section className="flex flex-col md:flex-row">
      <section className="flex flex-row w-full p-2">
        <DataTable columns={columns} data={jobApplications} />
      </section>
        <div className="w-full md:w-1/2 p-2">
          <Chart />
        </div>
        <div className="w-full md:w-1/2 p-2">
          <JobApplicationForm />
        </div>
      </section>
    </section>
  );
}

export default RouteComponent;
