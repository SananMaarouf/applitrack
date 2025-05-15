"use client"
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useJobsStore } from "@/store/jobsStore";
import { deleteApplication } from "@/app/actions";
import { ColumnDef, Row } from "@tanstack/react-table";
import { JobApplication, AggregatedStatusHistory } from "../types/jobApplication";
import { StatusSelect } from "../components/statusSelect";
import { ArrowUpDown, Trash2, ExternalLink, Link2Off } from "lucide-react";
import { useAggregatedStatusHistoryStore,  } from "@/store/aggregatedStatusHistoryStore";

const handleDelete = (
	row: Row<JobApplication>, 
	toast: (options: Record<string, unknown>) => { dismiss: () => void }, 
	setJobApplications: (jobs: JobApplication[]) => void, jobApplications: JobApplication[],
	setAggregatedStatusHistory: (statusChanges: AggregatedStatusHistory[]) => void
) => {
	/* destructure the row */
	const { id, user_id } = row.original;

	// Create a copy of the job application for restoration if needed
	const jobToDelete = jobApplications.find(job => job.id === id);

	// Remove the application from the UI immediately (optimistic UI update)
	setJobApplications(jobApplications.filter((job) => job.id !== id));

	// Create a toast with undo button and progress bar
	const ToastContent = () => {
		const [progress, setProgress] = useState(0);

		useEffect(() => {
			const interval = setInterval(() => {
				setProgress(prev => {
					if (prev >= 100) {
						clearInterval(interval);
						return 100;
					}
					return prev + 2; // Increase by 2% every 100ms to reach 100% in 5 seconds
				});
			}, 100);

			return () => clearInterval(interval);
		}, []);

		return (
			<div className="w-full space-y-2">
				<p>This action will complete in 5 seconds</p>
				<Progress value={progress} className="w-full bg-red-700 h-2" />
			</div>
		);
	};

	// Create a variable to track if deletion should be canceled
	let cancelDeletion = false;

	const { dismiss } = toast({
		title: "Job application will be deleted",
		description: <ToastContent />,
		duration: 5000, // 5 seconds
		action: (
			<Button
				variant="outline"
				size="sm"
				onClick={() => {
					// Flag that deletion should be canceled
					cancelDeletion = true;

					// Restore the job application in the store
					if (jobToDelete) {
						// Get the current state to ensure we're working with fresh data
						const currentJobs = useJobsStore.getState().jobApplications;
						setJobApplications([jobToDelete, ...currentJobs]);
					}

					dismiss();
				}}
			>
				Undo
			</Button>
		),
	});

	// Set a timeout to actually delete after 5 seconds
	setTimeout(() => {
		// Only proceed with deletion if it wasn't canceled
		if (!cancelDeletion) {
			/* call deleteApplication server action and pass in id and user_id */
			deleteApplication(id.toString(), user_id)
				.then((res) => {
					if (res.success) {

						// Update the aggregated status history in the aggregatedStatusHistoryStore
						setAggregatedStatusHistory(res.aggregatedStatusHistory as AggregatedStatusHistory[]);

						toast({
							title: "Success",
							description: "Job application deleted successfully",
							duration: 3000,
						});
					} else {
						// If deletion fails, restore the job in the UI
						if (jobToDelete) {
							// Get the current state to ensure we're working with fresh data
							const currentJobs = useJobsStore.getState().jobApplications;
							setJobApplications([...currentJobs, jobToDelete]);
						}

						toast({
							title: "Error",
							description: res.message,
							variant: "destructive",
						});
					}
				})
				.catch((err) => {
					console.error(err);

					// If deletion fails, restore the job in the UI
					if (jobToDelete) {
						// Get the current state to ensure we're working with fresh data
						const currentJobs = useJobsStore.getState().jobApplications;
						setJobApplications([...currentJobs, jobToDelete]);
					}

					toast({
						title: "Error",
						description: "Could not delete job application",
						variant: "destructive",
					});
				});
		}
	}, 5000);
}

function ActionsCell({ row }: { row: Row<JobApplication> }) {
    const { toast } = useToast();
    const setJobApplications = useJobsStore((state) => state.setJobs);
    const jobApplications = useJobsStore((state) => state.jobApplications);
    const setAggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.setAggregatedStatusHistory);

    return (
        <Button
            variant="destructive"
            onClick={() => handleDelete(
                row,
                toast,
                setJobApplications,
                jobApplications,
                setAggregatedStatusHistory
            )}
        >
            <Trash2 className="h-6 w-6" />
        </Button>
    );
}

export const columns: ColumnDef<JobApplication>[] = [
	{
		accessorKey: "position",
		enableHiding: true,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Position
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: "company",
		enableHiding: true,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Company
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: "applied_at",
		enableHiding: true,
		id: "applied",
		enableGlobalFilter: false,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Applied
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
	},
	{
		accessorKey: "expires_at",
		enableHiding: true,
		id: "expires",
		enableGlobalFilter: false,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Expires
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			const date = row.getValue("expires") as string;
			if (date != null) {
				return <div>{date}</div>
			}
			return <div>¯\_(ツ)_/¯</div>
		}
	},
	{
		accessorKey: "status",
		enableHiding: true,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Status
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return (
				<StatusSelect row={row} />
			);
		},
	},
	{
		accessorKey: "link",
		enableHiding: true,
		enableGlobalFilter: false,
		header: ({ column }) => {
			return (
				<Button
					variant="ghost"
					onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
					Link
					<ArrowUpDown className="ml-2 h-4 w-4" />
				</Button>
			);
		},
		cell: ({ row }) => {
			return (
				row.original && row.original.link ? (
					<a className="flex bg-link_btn text-link_btn-text w-fit p-1.5 rounded-md mx-auto" href={row.original.link} target="_blank" rel="noopener noreferrer">
						<ExternalLink className="h-6 w-6" />
					</a>
				) : (
					<Link2Off className="h-6 w-6 mx-auto " />
				)
			);
		},
	},
	{
		accessorKey: "actions",
		enableHiding: true,
		header: "",
		enableGlobalFilter: false,
		cell: ({ row }) => <ActionsCell row={row} />
	},
];