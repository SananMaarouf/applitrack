"use client";

import { Input } from "./ui/input";
import { columns } from "./columns";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { useJobsStore } from "@/store/jobsStore";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { bulkDeleteApplications, bulkUpdateApplications } from "@/app/actions/applications/actions";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from "./ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "./ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { JobStatus } from "@/types/jobStatus";
import { 
  flexRender, 
  SortingState, 
  useReactTable, 
  getCoreRowModel, 
  VisibilityState, 
  getSortedRowModel, 
  getFilteredRowModel, 
  getPaginationRowModel 
} from "@tanstack/react-table";

const LOCAL_STORAGE_KEY = "tableVisibilityState";

export function DataTable() {
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState([]);
  const jobApplications = useJobsStore((state) => state.jobApplications);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    if (jobApplications.length > 0 || loading) {
      setLoading(false); // Set loading to false once data is available
    }
  }, [jobApplications, loading]);

  const setJobApplications = useJobsStore((state) => state.setJobs);
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore((state) => state.setAggregatedStatusHistory);

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map(row => row.original.id.toString());
    const userId = selectedRows[0]?.original.user_id;

    if (!userId || selectedIds.length === 0) {
      toast.error("No rows selected");
      return;
    }

    // Store jobs to restore if needed
    const jobsToDelete = selectedRows.map(row => row.original);

    // Optimistically remove from UI
    const remainingJobs = jobApplications.filter(
      job => !selectedIds.includes(job.id.toString())
    );
    setJobApplications(remainingJobs);
    table.resetRowSelection();

    try {
      const result = await bulkDeleteApplications(selectedIds, userId);
      
      if (result.success) {
        setAggregatedStatusHistory(result.aggregatedStatusHistory || []);
        toast.success(`Successfully deleted ${selectedIds.length} job application(s)`);
      } else {
        // Restore on failure
        setJobApplications([...remainingJobs, ...jobsToDelete]);
        toast.error(result.message || "Failed to delete applications");
      }
    } catch (error) {
      // Restore on error
      setJobApplications([...remainingJobs, ...jobsToDelete]);
      toast.error("An error occurred while deleting");
      console.error(error);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedJobs = selectedRows.map(row => row.original);
    const userId = selectedRows[0]?.original.user_id;

    if (!userId || selectedJobs.length === 0) {
      toast.error("No rows selected");
      return;
    }

    const newStatusNum = parseInt(newStatus);

    // Store original jobs for rollback
    const originalJobs = [...selectedJobs];

    // Optimistically update UI
    const updatedJobs = jobApplications.map(job => {
      const isSelected = selectedJobs.find(sj => sj.id === job.id);
      if (isSelected) {
        return { ...job, status: newStatusNum };
      }
      return job;
    });
    setJobApplications(updatedJobs);
    table.resetRowSelection();

    try {
      const result = await bulkUpdateApplications(selectedJobs, newStatusNum, userId);
      
      if (result.success) {
        setAggregatedStatusHistory(result.aggregatedStatusHistory || []);
        toast.success(`Successfully updated ${selectedJobs.length} job application(s)`);
      } else {
        // Restore on failure
        const restoredJobs = jobApplications.map(job => {
          const original = originalJobs.find(oj => oj.id === job.id);
          return original || job;
        });
        setJobApplications(restoredJobs);
        toast.error(result.message || "Failed to update applications");
      }
    } catch (error) {
      // Restore on error
      const restoredJobs = jobApplications.map(job => {
        const original = originalJobs.find(oj => oj.id === job.id);
        return original || job;
      });
      setJobApplications(restoredJobs);
      toast.error("An error occurred while updating");
      console.error(error);
    }
  };

  const table = useReactTable({
    data: jobApplications,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
      rowSelection,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  // Load column visibility state from localStorage
  useEffect(() => {
    const savedState =
      typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (savedState) {
      setColumnVisibility(JSON.parse(savedState));
    }
  }, []);

  // Save column visibility state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility]);

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-foreground text-background px-3 rounded-lg">
        <div className="flex items-center py-4 gap-2">
          <Input
            placeholder="search..."
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(String(e.target.value))}
            className="max-w-sm text-primary-foreground"
          />
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <>
              <Select onValueChange={handleBulkStatusUpdate}>
                <SelectTrigger className="w-45 cursor-pointer bg-primary text-primary-foreground">
                  <SelectValue placeholder="Update Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={JobStatus.APPLIED.toString()}>Applied</SelectItem>
                  <SelectItem value={JobStatus.INTERVIEW.toString()}>Interview</SelectItem>
                  <SelectItem value={JobStatus.SECOND_INTERVIEW.toString()}>Second Interview</SelectItem>
                  <SelectItem value={JobStatus.THIRD_INTERVIEW.toString()}>Third Interview</SelectItem>
                  <SelectItem value={JobStatus.OFFER.toString()}>Offer</SelectItem>
                  <SelectItem value={JobStatus.REJECTED.toString()}>Rejected</SelectItem>
                  <SelectItem value={JobStatus.GHOSTED.toString()}>Ghosted</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="destructive" 
                onClick={handleBulkDelete}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({table.getFilteredSelectedRowModel().rows.length})
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="ml-auto">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="rounded-md" align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize cursor-pointer hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {loading ? (
          // Case 1: Loading state
          <div className="flex items-center justify-center h-96 text-muted-foreground text-sm font-semibold">
            Loading job applications...
          </div>
        ) : jobApplications.length > 0 ? (
          // Case 2: Loading is done and jobApplications is not empty
          <div className="">
            <Table className="">
              <TableHeader className="">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} className="bg-primary text-primary-foreground">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="bg-table">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {/* showing x of x job applications */}
            <div className="flex items-center justify-between py-4 px-2">
              <div className="text-sm ">
                Showing {table.getRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} job applications
              </div>
              <div className="text-sm">
                Page {table.getState().pagination.pageIndex + 1} of{" "}
                {table.getPageCount()}
              </div>
            </div>

            {/* prev/next btns */}
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                className=""
                variant="default"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                className=""
                variant="default"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        ) : (
          // Case 3: Loading is done and jobApplications is empty
          <div className="flex items-center justify-center h-96 text-background text-sm font-semibold">
            No job applications. Add some to get started!
          </div>
        )}
      </div>
    </div>
  );
}