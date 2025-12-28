"use client"
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useJobsStore } from "@/store/jobsStore";
import { deleteApplication } from "@/app/actions";
import { ColumnDef, Row } from "@tanstack/react-table";
import { JobApplication, AggregatedStatusHistory } from "../types/jobApplication";
import { StatusSelect } from "../components/statusSelect";
import { ArrowUpDown, Trash2, ExternalLink, Link2Off } from "lucide-react";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";

const getJobsSnapshot = (): JobApplication[] => {
	const { jobApplications } = useJobsStore.getState();
	if (Array.isArray(jobApplications)) {
		return jobApplications;
	}
	console.error("Unexpected jobApplications value", jobApplications);
	return [];
};

const handleDelete = (
	row: Row<JobApplication>,
	setJobApplications: (jobs: JobApplication[]) => void,
	setAggregatedStatusHistory: (statusChanges: AggregatedStatusHistory[]) => void
) => {
	/* destructure the row */
	const { id, user_id } = row.original;

	const jobApplications = getJobsSnapshot();
	const jobToDelete = jobApplications.find((job) => job.id === id);

	// Remove the application from the UI immediately (optimistic UI update)
	setJobApplications(jobApplications.filter((job) => job.id !== id));

	const restoreJobApplication = () => {
		if (!jobToDelete) {
			return;
		}
		const currentJobs = getJobsSnapshot().filter((job) => job.id !== jobToDelete.id);
		setJobApplications([...currentJobs,jobToDelete]);
	};

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

	const toastId = toast("Job application will be deleted", {
		description: <ToastContent />,
		duration: 5000,
		action: {
			label: "Undo",
			onClick: () => {
				cancelDeletion = true;
				restoreJobApplication();
				toast.dismiss(toastId);
			},
		},
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

						toast.success("Success ✅", {
							description: "Job application deleted successfully 🗑️",
							duration: 3000,
						});
					} else {
						// If deletion fails, restore the job in the UI
						restoreJobApplication();

						toast.error("Error", {
							description: res.message,
						});
					}
				})
				.catch((err) => {
					console.error(err);

					// If deletion fails, restore the job in the UI
					restoreJobApplication();

					toast.error("Error", {
						description: "Could not delete job application",
					});
				});
		}
	}, 5000);
}

function ActionsCell({ row }: { row: Row<JobApplication> }) {
	const setJobApplications = useJobsStore((state) => state.setJobs);
	const setAggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.setAggregatedStatusHistory);

	return (
		<Button
			variant="destructive"
			onClick={() => handleDelete(
				row,
				setJobApplications,
				setAggregatedStatusHistory
			)}
		>
			<Trash2 className="h-6 w-6" />
		</Button>
	);
}

export const columns: ColumnDef<JobApplication>[] = [
	{
		id: "select",
		header: ({ table }) => (
			<input
				type="checkbox"
				className="cursor-pointer w-4 h-4"
				checked={table.getIsAllPageRowsSelected()}
				onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<input
				type="checkbox"
				className="cursor-pointer w-4 h-4"
				checked={row.getIsSelected()}
				onChange={(e) => row.toggleSelected(!!e.target.checked)}
				aria-label="Select row"
			/>
		),
		enableHiding: false,
	},
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
		cell: ({ row }) => {
			const date = row.getValue("applied") as string;
			if (date) {
				const d = new Date(date);
				return <div>{d.getDate().toString().padStart(2, '0')}-{(d.getMonth() + 1).toString().padStart(2, '0')}-{d.getFullYear()}</div>
			}
			return <div>-</div>
		}
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
				const d = new Date(date);
				return <div>{d.getDate().toString().padStart(2, '0')}-{(d.getMonth() + 1).toString().padStart(2, '0')}-{d.getFullYear()}</div>
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