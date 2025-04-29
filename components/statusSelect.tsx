import { useJobsStore } from '@/store/jobsStore'; 
import { statusUpdate } from "../api/crud";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JobApplication } from "../types/jobApplication";
import { useToast } from "@/hooks/use-toast";

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
     * @param {string} jobId - The unique identifier of the job application to be updated.
     * @param {number} status - The new status to be set for the job application.
     * @param {Function} setJobApplications - A function to update the job applications in the local state.
     * @param {JobApplication[]} jobApplications - The current list of job applications in the local state.
     */
    const updateJobStatus = async (jobId: string, status: number, setJobApplications: any, jobApplications: JobApplication[]) => {
        try {
            // Call the statusUpdate function from crud.ts
            const updatedJobApplication = await statusUpdate(jobId, status);

            // Update the job applications in the local state
            const updatedJobApplications = jobApplications.map((jobApplication) => {
                if (jobApplication.id === updatedJobApplication.id) {
                    return updatedJobApplication;
                }
                return jobApplication;
            });
            setJobApplications(updatedJobApplications);

            // Show a success toast message
            toast({
                title: "Status Updated",
                description: "The status of the job application has been updated successfully.",
                duration: 5000,
            });

        } catch (error: any) {
            // Handle any unexpected errors that occur during the process
            toast({
                title: "Error",
                description: "Could not update status.",
                duration: 5000,
                variant: "destructive"
            });
        }
    };

    return (
        <span className=''>
            <Select
                value={status.toString()}
                onValueChange={(value) => updateJobStatus(row.original.id, parseInt(value), setJobApplications, jobApplications)}
            >
                <SelectTrigger className='border-gray-500  '>
                    <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className='bg-card border-2 border-gray-500'>     
                    <SelectItem value={JobStatus.APPLIED.toString()}>Applied</SelectItem>
                    <SelectItem value={JobStatus.INTERVIEW.toString()}>Interview</SelectItem>
                    <SelectItem value={JobStatus.SECOND_INTERVIEW.toString()}>Second Interview</SelectItem>
                    <SelectItem value={JobStatus.THIRD_INTERVIEW.toString()}>Third Interview</SelectItem>
                    <SelectItem value={JobStatus.OFFER.toString()}>Offer</SelectItem>
                    <SelectItem value={JobStatus.REJECTED.toString()}>Rejected</SelectItem>
                    <SelectItem value={JobStatus.GHOSTED.toString()}>Ghosted</SelectItem>
                </SelectContent>
            </Select>
        </span>
    );
}