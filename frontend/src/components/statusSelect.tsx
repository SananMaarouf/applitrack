"use client";

import { toast } from "sonner";
import { useJobsStore } from "@/store/jobsStore";
import { updateApplicationStatus, getStatusFlow } from "@/api/applications";
import type { JobApplication } from "@/types/jobApplication";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JobStatus } from "@/types/jobStatus";

interface Row {
  original: JobApplication;
}

export function StatusSelect({ row }: { row: Row }) {
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

  const updateJobStatus = async (jobApplication: JobApplication, newStatus: number) => {
    try {
      await updateApplicationStatus(jobApplication.user_id, jobApplication.id, newStatus);

      setJobApplications(
        jobApplications.map((job) =>
          job.id === jobApplication.id ? { ...job, status: newStatus } : job,
        ),
      );

      const flow = await getStatusFlow(jobApplication.user_id);
      setAggregatedStatusHistory(flow);

      toast.success("Job application status updated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Could not update job application status");
    }
  };

  return (
    <span>
      <Select
        value={status.toString()}
        onValueChange={(value) => updateJobStatus(row.original, parseInt(value))}
      >
        <SelectTrigger className="bg-primary cursor-pointer text-primary-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="cursor-pointer">
          <SelectItem className="cursor-pointer" value={JobStatus.APPLIED.toString()}>
            Applied
          </SelectItem>
          <SelectItem className="cursor-pointer" value={JobStatus.INTERVIEW.toString()}>
            Interview
          </SelectItem>
          <SelectItem className="cursor-pointer" value={JobStatus.SECOND_INTERVIEW.toString()}>
            Second Interview
          </SelectItem>
          <SelectItem className="cursor-pointer" value={JobStatus.THIRD_INTERVIEW.toString()}>
            Third Interview
          </SelectItem>
          <SelectItem className="cursor-pointer" value={JobStatus.OFFER.toString()}>
            Offer
          </SelectItem>
          <SelectItem className="cursor-pointer" value={JobStatus.REJECTED.toString()}>
            Rejected
          </SelectItem>
          <SelectItem className="cursor-pointer" value={JobStatus.GHOSTED.toString()}>
            Ghosted
          </SelectItem>
        </SelectContent>
      </Select>
    </span>
  );
}
