"use client";

import { ReactNode, useEffect } from "react";
import { useJobsStore } from "@/store/jobsStore";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { JobApplication, AggregatedStatusHistory } from "@/types/jobApplication";



interface ApplicationsClientProps {
  applications: JobApplication[];
  aggregated_status_history: AggregatedStatusHistory[];
  children: ReactNode;
}

export default function ApplicationsClient({ applications, aggregated_status_history, children }: ApplicationsClientProps) {
  const setApplications = useJobsStore((state) => state.setJobs);
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.setAggregatedStatusHistory);

  useEffect(() => {
    // Populate Zustand store with applications data
    setApplications(applications);
    setAggregatedStatusHistory(aggregated_status_history);
  }, [applications, setApplications, aggregated_status_history, setAggregatedStatusHistory]);

  return (
    <>  
      { children }
    </>
  )
}