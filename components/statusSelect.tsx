"use client";
import { useToast } from "@/hooks/use-toast";
import { useJobsStore } from '@/store/jobsStore';
import { updateApplication } from "../app/actions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define an enum for job application statuses
export enum JobStatus {
	APPLIED = 1,
	INTERVIEW = 2,
	SECOND_INTERVIEW = 3,
	THIRD_INTERVIEW = 4,
	OFFER = 5,
	REJECTED = 6,
	GHOSTED = 7
}

export default function StatusSelect({ row }: any) {
	const { toast } = useToast();

	// Subscribe to the jobApplications state and get the setJobApplications function
	const jobApplications = useJobsStore((state) => state.jobApplications);
	const setJobApplications = useJobsStore((state) => state.setJobs);

	// Find the current job application in the state
	const currentJobApplication = jobApplications.find(job => job.id === row.original.id);
	const status = currentJobApplication ? currentJobApplication.status : row.original.status;

	/**
	 * Updates the status of a job application in the database and the local state.
	 *
	 * @param {string} id - The unique identifier of the job application to be updated.
	 * @param {number} status - The new status to be set for the job application.
	 * @param {string} user_id - The unique identifier of the user who owns the job application.
	 * @param {Function} setJobApplications - A function to update the job applications in the local state.
	 * @param {JobApplication[]} jobApplications - The current list of job applications in the local state.
	 */
	const updateJobStatus = async (status: number) => {
		const { id, user_id } = row.original;
		updateApplication(id, user_id, status)
			.then((res) => {
				if (res.success) {
					// Update the job application in the store
					setJobApplications(jobApplications.map((job) => {
						if (job.id === id) {
							return { ...job, status: status };
						}
						return job;
					}
					));
					toast({
						title: "Success",
						description: "Job application status updated successfully",
					});
				} else {
					toast({
						title: "Error",
						description: res.message,
						variant: "destructive",
					});
				}
			})
			.catch((err) => {
				console.error(err);
				toast({
					title: "Error",
					description: "Could not update job application status",
					variant: "destructive",
				});
			});


	};

	return (
		<span>
			<Select
				value={status.toString()}
				onValueChange={(value) => updateJobStatus(parseInt(value))}
			>
				<SelectTrigger className='
					bg-primary hover:bg-hover 
					text-primary-foreground hover:text-card-foreground 
					transition-colors duration-300'>
					<SelectValue />
				</SelectTrigger>
				<SelectContent className='bg-primary border-2 border-gray-500'>
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
