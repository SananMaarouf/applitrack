"use client";

import { useEffect } from "react";
import { useJobsStore } from "@/store/jobsStore";
import { DataTable } from "@/components/data-table";

interface ApplicationsClientProps {
  applications: any[];
}

export default function ApplicationsClient({ applications }: ApplicationsClientProps) {
  const setApplications = useJobsStore((state) => state.setJobs);

  useEffect(() => {
    // Populate Zustand store with applications data
    setApplications(applications);
  }, [applications, setApplications]);

  console.log(`[${new Date().toISOString()}] in applicationsClient:`, applications);  
  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <DataTable />
    </div>
  );
}