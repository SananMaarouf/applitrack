import Loading from "./loading";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Chart } from "@/components/pieChart";
import { DataTable } from "@/components/data-table";
import { createClient } from "@/utils/supabase/server";
import { ApplicationsClient } from "./applicationsClient";
import { SankeyDiagram } from "@/components/sankey-diagram";
import { JobApplicationForm } from "@/components/jobApplicationForm"
import { JobApplication, AggregatedStatusHistory } from "@/types/jobApplication";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default async function DasboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return redirect("/auth");
  }

  // Fetch applications and assert the type
  const { data } = await supabase.from("applications").select().order("created_at", { ascending: false });
  const applications = (data ?? []) as JobApplication[];

  // Fetch aggregated status history and assert the type
  const { data: aggregatedStatusHistoryData } = await supabase.from("application_status_flow").select("*").eq("user_id", user.id);
  const aggregatedStatusHistory = (aggregatedStatusHistoryData ?? []) as AggregatedStatusHistory[];

  return (
    <Suspense fallback={<Loading />}>
      {/* pass in data from server to client components */}
      <ApplicationsClient applications={applications} aggregated_status_history={aggregatedStatusHistory}>
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <section className="w-full">
            <Chart />
          </section>
          <section className="w-full">
            <JobApplicationForm user_id={user?.id} />
          </section>
        </section>
        <Accordion type="multiple" defaultValue={["item-2"]}>
          <AccordionItem value="item-1">
            <AccordionTrigger className="px-4">Status History</AccordionTrigger>
            <AccordionContent>
              <SankeyDiagram />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger className="px-4">Application datatable</AccordionTrigger>
            <AccordionContent>
              <DataTable />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ApplicationsClient>
    </Suspense>
  );
}