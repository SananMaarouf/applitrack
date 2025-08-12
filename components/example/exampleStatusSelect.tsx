"use client";
import { useToast } from "@/hooks/use-toast";
import { useJobsStore } from "@/store/jobsStore";
import { JobApplication, AggregatedStatusHistory } from "@/types/jobApplication";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobStatus } from "@/types/jobStatus";

// Define the type for the "row" object
interface Row {
	original: JobApplication;
}

export function ExampleStatusSelect({ row }: { row: Row }) {
	const { toast } = useToast();

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
		// For mock/example: just show a success toast, no real update
		toast({
			title: "Success ✅",
			description: "This is what you would see if status was updated successfully",
			variant: "success",
		});
	};

	return (
		<span>
			<Select value={status.toString()} onValueChange={(value) => updateJobStatus(row.original, parseInt(value))}>
				<SelectTrigger className="bg-primary hover:bg-hover text-primary-foreground hover:text-card-foreground transition-colors duration-300">
					<SelectValue />
				</SelectTrigger>
				<SelectContent className="bg-primary border-2 border-gray-500">
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.APPLIED.toString()}>Applied</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.INTERVIEW.toString()}>Interview</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.SECOND_INTERVIEW.toString()}>Second Interview</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.THIRD_INTERVIEW.toString()}>Third Interview</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.OFFER.toString()}>Offer</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.REJECTED.toString()}>Rejected</SelectItem>
					<SelectItem className="focus:bg-hover focus:text-card-foreground" value={JobStatus.GHOSTED.toString()}>Ghosted</SelectItem>
				</SelectContent>
			</Select>
		</span>
	);
}