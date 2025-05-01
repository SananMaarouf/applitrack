"use client"
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useJobsStore } from "@/store/jobsStore";
import { deleteApplication } from "@/app/actions";
import StatusSelect from "../components/statusSelect";
import { ColumnDef, Row } from "@tanstack/react-table";
import { JobApplication } from "../types/jobApplication";
import { ArrowUpDown, Trash2, ExternalLink, Link, Link2Off } from "lucide-react";

const handleDelete = (row: Row<JobApplication>, toast: Function, setJobApplications: (jobs: JobApplication[]) => void, jobApplications: JobApplication[],) => {
	/* destructure the row */
	const { id, user_id } = row.original;

	/* call deleteApplication server action and pass in id and user_id */
	deleteApplication(id, user_id)
		.then((res) => {
			if (res.success) {
				// Remove the application from the store
				setJobApplications(jobApplications.filter((job) => job.id !== id));

				toast({
					title: "Success",
					description: "Job application deleted successfully",
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
				description: "Could not delete job application",
				variant: "destructive",
			});
		});

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
			const date = row.getValue("expires") as String;
			if (date != "") {
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
		cell: ({ row }) => {
			const { toast } = useToast();
			const setJobApplications = useJobsStore((state) => state.setJobs);
			const jobApplications = useJobsStore((state) => state.jobApplications);

			return (
				<Button
					variant="destructive"
					onClick={() => handleDelete(row, toast, setJobApplications, jobApplications)} >
					<Trash2 className="h-6 w-6" />
				</Button>
			);
		},
	},
];