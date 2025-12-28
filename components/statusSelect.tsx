"use client";
import { toast, useSonner } from "sonner";
import { useToast } from "@/hooks/use-toast";
import { useJobsStore } from "@/store/jobsStore";
import { updateApplication } from "../app/actions";
import { JobApplication, AggregatedStatusHistory } from "@/types/jobApplication";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobStatus } from "@/types/jobStatus";

// Define the type for the "row" object
interface Row {
	original: JobApplication;
}

export function StatusSelect({ row }: { row: Row }) {

	// Subscribe to the jobApplications state and get the setJobApplications function
	const jobApplications = useJobsStore((state) => state.jobApplications);
	const setJobApplications = useJobsStore((state) => state.setJobs);

	const setAggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.setAggregatedStatusHistory);

	// Find the current job application in the state
	const currentJobApplication = jobApplications.find(job => job.id === row.original.id);
	const status = currentJobApplication ? currentJobApplication.status : row.original.status;

	/**
	 * Updates the status of a job application in the database and the local state.
	 *
	 * @param {JobApplication} jobApplication - The job application object to update.
	 * @param {number} newStatus - The new status to be set for the job application.
	 */
	const updateJobStatus = async (jobApplication: JobApplication, newStatus: number) => {
		updateApplication(jobApplication, newStatus)
			.then((res) => {
				if (res?.success) {
					// Update the job application in the store
					setJobApplications(jobApplications.map((job) => {
						if (job.id === jobApplication.id) {
							return { ...job, status: newStatus };
						}
						return job;
					}));
					// Update the aggregated status history in the aggregatedStatusHistoryStore
					setAggregatedStatusHistory(res.aggregatedStatusHistory as AggregatedStatusHistory[]);

					toast.success("Job application status updated successfully!");
				} else {
					toast.error(res?.message || "An error occurred while updating the job application status.");
				}
			})
			.catch((err) => {
				console.error(err);
				toast.error("Could not update job application status");
			});
	};

	return (
		<span>
			<Select value={status.toString()} onValueChange={(value) => updateJobStatus(row.original, parseInt(value))}>
				<SelectTrigger className="bg-primary cursor-pointer text-primary-foreground">
					<SelectValue />
				</SelectTrigger>
				<SelectContent className="cursor-pointer">
					<SelectItem className="cursor-pointer" value={JobStatus.APPLIED.toString()}>Applied</SelectItem>
					<SelectItem className="cursor-pointer" value={JobStatus.INTERVIEW.toString()}>Interview</SelectItem>
					<SelectItem className="cursor-pointer" value={JobStatus.SECOND_INTERVIEW.toString()}>Second Interview</SelectItem>
					<SelectItem className="cursor-pointer" value={JobStatus.THIRD_INTERVIEW.toString()}>Third Interview</SelectItem>
					<SelectItem className="cursor-pointer" value={JobStatus.OFFER.toString()}>Offer</SelectItem>
					<SelectItem className="cursor-pointer" value={JobStatus.REJECTED.toString()}>Rejected</SelectItem>
					<SelectItem className="cursor-pointer" value={JobStatus.GHOSTED.toString()}>Ghosted</SelectItem>
				</SelectContent>
			</Select>
		</span>
	);
}