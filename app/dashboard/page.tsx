import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "./loading";
import ApplicationsClient from "./applicationsClient";

export default async function DasboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  const { data: applications } = await supabase.from("applications").select();
  console.log(`[${new Date().toISOString()}] applications data:`, applications);  
  return (
    <Suspense fallback={<Loading />}>
      <ApplicationsClient applications={applications || []} />
    </Suspense>
  );
}