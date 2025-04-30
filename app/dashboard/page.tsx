import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import ApplicationsClient from "./applicationsClient";
import { DataTable } from "@/components/data-table";
import { Chart } from "@/components/pieChart";

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
      {/* 
        pass in data from server to client components.
        ApplicationsClient is a client component that uses the data from the server
        and passes it to the children client components.
      */}
      <ApplicationsClient applications={applications || []}>
        <div className="flex-1 w-full flex flex-col gap-12">
          <Chart />
          <DataTable />
        </div>
      </ApplicationsClient>
    </Suspense>
  );
}