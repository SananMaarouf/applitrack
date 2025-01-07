import { ColumnDef } from "@tanstack/react-table";
import { Button } from "./ui/button";
import { ArrowUpDown } from "lucide-react";
import StatusSelect from "@/components/statusSelect"
import { deleteApplication } from "@/api/crud";
import { JobApplication } from "@/types";
import { useJobsStore } from "@/store/jobsStore";
import { useToast } from "@/hooks/use-toast";
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
            )
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
            )
        }
    },
    {
        accessorKey: "applied_at",
        enableHiding: true,
        id: "applied",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Applied
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        }
    },
    {
        accessorKey: "expires_at",
        enableHiding: true,
        id: "expires",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Expires
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
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
            )
        },
        cell: ({ row }) => {
            return (
                <StatusSelect row={row} />
            );
        }
    },
    {
        accessorKey: "link",
        enableHiding: true,
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
                    Link
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            return (
                row.original && row.original.link ? (
                    <Button>
                        <a href={row.original.link} target="_blank" rel="noopener noreferrer">Link</a>
                    </Button>
                ) : (
                    <span>No Link</span>
                )
            );
        }
    },
    {
        accessorKey: "actions",
        enableHiding: true,
        header: "",
        cell: ({ row }) => {
            const setJobApplications = useJobsStore((state) => state.setJobs);
            const jobApplications = useJobsStore((state) => state.jobApplications);
            const { toast } = useToast();

            const handleDelete = async () => {
                const jobId = row.original.id.toString();
                try {
                    await deleteApplication(jobId);
                    
                    // Update the Zustand store to remove the deleted job application
                    setJobApplications(jobApplications.filter((job) => job.id.toString() !== jobId));
                    toast({
                        title: "Success",
                        description: "Job application deleted successfully.",
                        duration: 5000,
                    });
                } catch (error: any) {
                    toast({
                        title: "Error",
                        description: error.message || "An error occurred while deleting the job application.",
                        duration: 5000,
                        variant: "destructive"
                    });
                }
            };

            return (
                <div className="flex space-x-2">
                    <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                </div>
            );
        }
    }
];