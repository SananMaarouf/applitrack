import { ColumnDef } from "@tanstack/react-table";
import { Button } from "./ui/button";
import { ArrowUpDown, Trash2, ExternalLink, Link, Link2Off } from "lucide-react";
import StatusSelect from "@/components/statusSelect";
import { deleteApplication } from "@/api/crud";
import { JobApplication } from "@/types";
import { useJobsStore } from "@/store/jobsStore";
import { useToast } from "@/hooks/use-toast";

const handleDelete = async (jobId: string, setJobApplications: (jobs: JobApplication[]) => void, jobApplications: JobApplication[], toast: any) => {
  try {
    await deleteApplication(jobId);

    // Update the Zustand store to remove the deleted job application
    setJobApplications(jobApplications.filter((job) => job.id!.toString() !== jobId));
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
        <StatusSelect className="" row={row} />
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
      const setJobApplications = useJobsStore((state) => state.setJobs);
      const jobApplications = useJobsStore((state) => state.jobApplications);
      const { toast } = useToast();

      return (
        <Button
          variant="destructive"
          onClick={() => handleDelete(row.original.id!.toString(), setJobApplications, jobApplications, toast)}>
          <Trash2 className="h-6 w-6" />
        </Button>
      );
    },
  },
];