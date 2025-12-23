import Loading from "./loading";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Chart } from "@/components/pieChart";
import { DataTable } from "@/components/data-table";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { applications } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { ApplicationsClient } from "./applicationsClient";
import { SankeyDiagram } from "@/components/sankey-diagram";
import { JobApplicationForm } from "@/components/jobApplicationForm"
import { JobApplication, AggregatedStatusHistory } from "@/types/jobApplication";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default async function DasboardPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return redirect("/sign-in");
  }

  // Fetch applications
  const data = await db.select().from(applications)
    .where(eq(applications.userId, userId))
    .orderBy(desc(applications.createdAt));
  
  const applicationsData = data.map(app => ({
    id: app.id,
    created_at: app.createdAt.toISOString(),
    user_id: app.userId,
    applied_at: app.appliedAt.toISOString(),
    expires_at: app.expiresAt?.toISOString(),
    position: app.position,
    company: app.company,
    status: app.status,
    link: app.link || undefined,
  })) as JobApplication[];

  // Fetch aggregated status history using raw SQL for the view
  const aggregatedStatusHistoryResult = await db.execute(
    sql`SELECT * FROM application_status_flow WHERE user_id = ${userId}`
  );
  const aggregatedStatusHistory = aggregatedStatusHistoryResult.rows as AggregatedStatusHistory[] ?? [];
  return (
      /* pass in data from server to client components */     
    <Suspense fallback={<Loading />}>
     <ApplicationsClient applications={applicationsData} aggregated_status_history={aggregatedStatusHistory}>
        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <section className="w-full">
            <Chart />
          </section>
          <section className="w-full">
            <JobApplicationForm user_id={userId} />
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