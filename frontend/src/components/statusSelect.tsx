"use client";

import { toast } from "sonner";
import { useJobsStore } from "@/store/jobsStore";
import { updateApplicationStatus, getStatusFlow } from "@/api/applications";
import type { JobApplication } from "@/types/jobApplication";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { useAuth } from "@clerk/clerk-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select2";
import { JOB_STATUS_OPTIONS, getJobStatusUi } from "@/lib/job-status-ui";

interface Row {
  original: JobApplication;
}

export function StatusSelect({ row }: { row: Row }) {
  const { getToken } = useAuth();
  const jobApplications = useJobsStore((state) => state.jobApplications);
  const setJobApplications = useJobsStore((state) => state.setJobs);
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore(
    (state) => state.setAggregatedStatusHistory,
  );

  const currentJobApplication = jobApplications.find(
    (job) => job.id === row.original.id,
  );
  const status = currentJobApplication
    ? currentJobApplication.status
    : row.original.status;
  const statusUi = getJobStatusUi(status);

  const updateJobStatus = async (jobApplication: JobApplication, newStatus: number) => {
    try {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      await updateApplicationStatus(token, jobApplication.id, newStatus);

      setJobApplications(
        jobApplications.map((job) =>
          job.id === jobApplication.id ? { ...job, status: newStatus } : job,
        ),
      );

      const flow = await getStatusFlow(token);
      setAggregatedStatusHistory(flow);

      toast.success("Job application status updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Could not update job application status");
    }
  };

  return (
    <Select
      value={status.toString()}
      onValueChange={(value) => updateJobStatus(row.original, parseInt(value))}
    >
      <SelectTrigger
        className="status-tint w-44 cursor-pointer font-medium shadow-none"
        data-status={statusUi.key}
        aria-label={`Status: ${statusUi.label}`}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {JOB_STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value.toString()}>
            <span
              className="status-dot size-2.5 shrink-0 rounded-full"
              data-status={option.key}
              aria-hidden="true"
            />
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
