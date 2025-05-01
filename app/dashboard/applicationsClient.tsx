"use client";

import { ReactNode, useEffect } from "react";
import { useJobsStore } from "@/store/jobsStore";

interface ApplicationsClientProps {
  applications: any[];
  children: ReactNode; // Allow rendering children inside this component
}

export default function ApplicationsClient({ applications, children }: ApplicationsClientProps) {
  const setApplications = useJobsStore((state) => state.setJobs);

  useEffect(() => {
    // Populate Zustand store with applications data
    setApplications(applications);
  }, [applications, setApplications]);
  
  return <>{children}</>;
}