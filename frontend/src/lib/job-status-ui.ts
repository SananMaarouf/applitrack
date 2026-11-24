import { JobStatus } from "@/types/jobStatus";

export type JobStatusUi = {
  key: string;
  label: string;
  color: string;
};

/**
 * Shared presentation contract for job application statuses.
 *
 * The `color` value intentionally points at the CSS custom property so every
 * consumer (charts, legends, badges, …) stays in sync across light and dark.
 */
export const JOB_STATUS_UI: Record<JobStatus, JobStatusUi> = {
  [JobStatus.APPLIED]: {
    key: "applied",
    label: "Applied",
    color: "var(--status-applied-chart)",
  },
  [JobStatus.INTERVIEW]: {
    key: "interview",
    label: "Interview",
    color: "var(--status-interview-chart)",
  },
  [JobStatus.SECOND_INTERVIEW]: {
    key: "second-interview",
    label: "Second Interview",
    color: "var(--status-second-interview-chart)",
  },
  [JobStatus.THIRD_INTERVIEW]: {
    key: "third-interview",
    label: "Third Interview",
    color: "var(--status-third-interview-chart)",
  },
  [JobStatus.OFFER]: {
    key: "offer",
    label: "Offer",
    color: "var(--status-offer-chart)",
  },
  [JobStatus.REJECTED]: {
    key: "rejected",
    label: "Rejected",
    color: "var(--status-rejected-chart)",
  },
  [JobStatus.GHOSTED]: {
    key: "ghosted",
    label: "Ghosted",
    color: "var(--status-ghosted-chart)",
  },
};

export const JOB_STATUS_OPTIONS = (
  Object.entries(JOB_STATUS_UI) as [string, JobStatusUi][]
)
  .map(([value, ui]) => ({ value: Number(value), ...ui }))
  .sort((a, b) => a.value - b.value);

export function getJobStatusUi(status: number): JobStatusUi {
  return JOB_STATUS_UI[status as JobStatus] ?? JOB_STATUS_UI[JobStatus.APPLIED];
}
