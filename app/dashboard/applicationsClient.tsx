"use client";

import { ReactNode, useEffect } from "react";
import { useJobsStore } from "@/store/jobsStore";
import { useStatusHistoryStore } from "@/store/jobsStatusHistoryStore";
import { JobApplication, JobApplicationStatusHistory } from "@/types/jobApplication";

interface ApplicationsClientProps {
  applications: JobApplication[];
  application_status_history: JobApplicationStatusHistory[];
  children: ReactNode;
}

export default function ApplicationsClient({ applications, application_status_history, children }: ApplicationsClientProps) {
  const setApplications = useJobsStore((state) => state.setJobs);
  const setHistory = useStatusHistoryStore((state) => state.setJobApplicationStatusHistory);

  useEffect(() => {
    // Populate Zustand store with applications data
    setApplications(applications);
    setHistory(application_status_history);
  }, [applications, setApplications, application_status_history, setHistory]);

  return (
    <>  
      { children }
    </>
  )
}