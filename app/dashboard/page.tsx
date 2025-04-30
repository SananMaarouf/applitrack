import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import ApplicationsClient from "./applicationsClient";
import { DataTable } from "@/components/data-table";
import { Chart } from "@/components/pieChart";
import { JobApplicationForm } from "@/components/jobApplicationForm"

export default async function DasboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/sign-in");
  }

  const { data: applications } = await supabase.from("applications").select();
  //console.log(`[${new Date().toISOString()}] applications data:`, applications);

  return (
    <Suspense fallback={<Loading />}>
    {/* pass in data from server to client components */}
    <ApplicationsClient applications={applications || []}>
      <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
        <div className="w-full">
          <Chart />
        </div>
        <div className="w-full">
          <JobApplicationForm userId={user?.id} />
        </div>
      </section>
      <DataTable />
    </ApplicationsClient>
  </Suspense>
  );
}