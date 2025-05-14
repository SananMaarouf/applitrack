"use client";

import { ReactNode, useEffect } from "react";
import { useJobsStore } from "@/store/jobsStore";
import { useStatusHistoryStore } from "@/store/jobsStatusHistoryStore";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { JobApplication, JobApplicationStatusHistory, AggregatedStatusHistory } from "@/types/jobApplication";



interface ApplicationsClientProps {
  applications: JobApplication[];
  application_status_history: JobApplicationStatusHistory[];
  aggregated_status_history: AggregatedStatusHistory[];
  children: ReactNode;
}

export default function ApplicationsClient({ applications, application_status_history, aggregated_status_history, children }: ApplicationsClientProps) {
  const setApplications = useJobsStore((state) => state.setJobs);
  const setHistory = useStatusHistoryStore((state) => state.setJobApplicationStatusHistory);
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.setAggregatedStatusHistory);

  useEffect(() => {
    // Populate Zustand store with applications data
    setApplications(applications);
    setHistory(application_status_history);
    setAggregatedStatusHistory(aggregated_status_history);
  }, [applications, setApplications, application_status_history, setHistory, aggregated_status_history, setAggregatedStatusHistory]);

  return (
    <>  
      { children }
    </>
  )
}