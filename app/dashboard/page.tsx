import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import ApplicationsClient from "./applicationsClient";
import { DataTable } from "@/components/data-table";
import { Chart } from "@/components/pieChart";
import { JobApplicationForm } from "@/components/jobApplicationForm"
import { SankeyDiagram } from "@/components/sankey-diagram";
export default async function DasboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/auth");
  }
  // Fetch applications from the applications table sorted by created_at in descending order
  const { data: applications } = await supabase.from("applications").select().order("created_at", { ascending: false });

  // fetch application_status_history from the application_status_history table sorted by id in ascending order
  const { data: applicationStatusHistory } = await supabase.from("application_status_history").select().order("id", { ascending: true });
  return (
    <Suspense fallback={<Loading />}>
      {/* pass in data from server to client components */}
      <ApplicationsClient applications={applications || []} application_status_history={applicationStatusHistory || []}>
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
          <section className="w-full">
            <Chart />
          </section>
          <section className="w-full">
            <JobApplicationForm user_id={user?.id} />
          </section>
        </section>
        <SankeyDiagram />
        <DataTable />
      </ApplicationsClient>
    </Suspense>
  );
}