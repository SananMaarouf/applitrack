import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import ApplicationsClient from "./applicationsClient";
import { DataTable } from "@/components/data-table";
import { Chart } from "@/components/pieChart";
import { JobApplication, JobApplicationStatusHistory, AggregatedStatusHistory } from "@/types/jobApplication";

import { JobApplicationForm } from "@/components/jobApplicationForm"
import { SankeyDiagram } from "@/components/sankey-diagram";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default async function DasboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/auth");
  }

  // Fetch applications and assert the type
  const { data } = await supabase.from("applications").select().order("created_at", { ascending: false });
  const applications = (data ?? []) as JobApplication[];

  // Fetch application status history and assert the type
  const { data: statusHistoryData } = await supabase.from("application_status_history").select().order("id", { ascending: true });
  const applicationStatusHistory = (statusHistoryData ?? []) as JobApplicationStatusHistory[];

  // Fetch aggregated status history and assert the type
  const { data: aggregatedStatusHistoryData } = await supabase.from("application_status_flow").select("*");
  const aggregatedStatusHistory = (aggregatedStatusHistoryData ?? []) as AggregatedStatusHistory[];
  
  return (
    <Suspense fallback={<Loading />}>
      {/* pass in data from server to client components */}
      <ApplicationsClient applications={applications} application_status_history={applicationStatusHistory} aggregated_status_history={aggregatedStatusHistory}>
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl mx-auto">
          <section className="w-full">
            <Chart />
          </section>
          <section className="w-full">
            <JobApplicationForm user_id={user?.id} />
          </section>
        </section>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Application Status History</AccordionTrigger>
            <AccordionContent>
              <SankeyDiagram />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
        <DataTable />
      </ApplicationsClient>
    </Suspense>
  );
}