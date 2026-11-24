"use client";

import { Input } from "@/components/ui/input";
import { columns } from "@/components/columns";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useJobsStore } from "@/store/jobsStore";
import { useAggregatedStatusHistoryStore } from "@/store/aggregatedStatusHistoryStore";
import { deleteApplication, updateApplicationStatus, getStatusFlow } from "@/api/applications";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "sonner";
import { ClipboardList, Loader2, Search, SlidersHorizontal, Trash2 } from "lucide-react";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select2";
import { JOB_STATUS_OPTIONS } from "@/lib/job-status-ui";
import type { JobApplication } from "@/types/jobApplication";
import {
  flexRender,
  SortingState,
  useReactTable,
  getCoreRowModel,
  VisibilityState,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from "@tanstack/react-table";

const LOCAL_STORAGE_KEY = "tableVisibilityState";

export function DataTable() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState<string>("");
  const jobApplications = useJobsStore((state) => state.jobApplications);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  useEffect(() => {
    setLoading(false);
  }, [jobApplications]);

  const setJobApplications = useJobsStore((state) => state.setJobs);
  const setAggregatedStatusHistory = useAggregatedStatusHistoryStore(
    (state) => state.setAggregatedStatusHistory,
  );

  const refreshStatusFlow = async (token: string) => {
    const flow = await getStatusFlow(token);
    setAggregatedStatusHistory(flow);
  };

  const handleBulkDelete = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedIds = selectedRows.map((row) => row.original.id);

    if (selectedIds.length === 0) {
      toast.error("No rows selected");
      return;
    }

    const token = await getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    const jobsToDelete = selectedRows.map((row) => row.original);

    const remainingJobs = jobApplications.filter(
      (job) => !selectedIds.includes(job.id),
    );
    setJobApplications(remainingJobs);
    table.resetRowSelection();

    try {
      await Promise.all(selectedIds.map((id) => deleteApplication(token, id)));
      await refreshStatusFlow(token);
      toast.success(`Successfully deleted ${selectedIds.length} job application(s)`);
    } catch (error: any) {
      setJobApplications([...remainingJobs, ...jobsToDelete]);
      toast.error(error?.message || "Failed to delete applications");
      console.error(error);
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const selectedJobs = selectedRows.map((row) => row.original as JobApplication);

    if (selectedJobs.length === 0) {
      toast.error("No rows selected");
      return;
    }

    const token = await getToken();
    if (!token) {
      toast.error("Not authenticated");
      return;
    }

    const newStatusNum = parseInt(newStatus);

    const jobsToUpdate = selectedJobs.filter((job) => job.status !== newStatusNum);

    if (jobsToUpdate.length === 0) {
      table.resetRowSelection();
      toast.error("All selected rows already have this status");
      return;
    }

    const originalJobs = [...jobsToUpdate];
    const selectedJobIds = new Set(jobsToUpdate.map((job) => job.id));

    const updatedJobs = jobApplications.map((job) => {
      if (selectedJobIds.has(job.id)) {
        return { ...job, status: newStatusNum };
      }
      return job;
    });
    setJobApplications(updatedJobs);
    table.resetRowSelection();

    try {
      // Run sequentially to keep failure handling simple
      for (const job of jobsToUpdate) {
        await updateApplicationStatus(token, job.id, newStatusNum);
      }
      await refreshStatusFlow(token);
      const unchangedCount = selectedJobs.length - jobsToUpdate.length;
      const message =
        unchangedCount > 0
          ? `Successfully updated ${jobsToUpdate.length} job application(s). Skipped ${unchangedCount} already in that status.`
          : `Successfully updated ${jobsToUpdate.length} job application(s)`;
      toast.success(message);
    } catch (error: any) {
      const restoredJobs = jobApplications.map((job) => {
        const original = originalJobs.find((oj) => oj.id === job.id);
        return original || job;
      });
      setJobApplications(restoredJobs);
      toast.error(error?.message || "Failed to update applications");
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

  useEffect(() => {
    const savedState =
      typeof window !== "undefined" ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (savedState) {
      setColumnVisibility(JSON.parse(savedState));
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility]);

  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4">
          <div className="relative w-full sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              aria-label="Search applications"
              placeholder="Search applications…"
              value={globalFilter}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedCount > 0 && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedCount} selected
                </span>
                <Select onValueChange={handleBulkStatusUpdate}>
                  <SelectTrigger
                    className="w-44"
                    aria-label="Update status for selected rows"
                  >
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete ({selectedCount})
                </Button>
              </>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="ml-auto sm:ml-0">
                  <SlidersHorizontal className="size-4" aria-hidden="true" />
                  Columns
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-44" align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="cursor-pointer capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading job applications…
          </div>
        ) : jobApplications.length > 0 ? (
          <>
            <Table className="min-w-[760px]">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No applications match your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex flex-col gap-3 border-t border-border px-3 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-4">
              <p>
                Showing {table.getRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} job applications
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm">
                  Page {table.getState().pagination.pageIndex + 1} of{" "}
                  {Math.max(table.getPageCount(), 1)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <ClipboardList className="size-8 text-muted-foreground" aria-hidden="true" />
            <p className="font-medium text-foreground">No applications yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your first job application to start tracking its progress.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
