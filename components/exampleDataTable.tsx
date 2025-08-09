"use client";

import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState } from "react";
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from "./ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "./ui/dropdown-menu";
import {
  flexRender,
  SortingState,
  useReactTable,
  getCoreRowModel,
  VisibilityState,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef
} from "@tanstack/react-table";

interface JobApplication {
  id: number;
  user_id: string;
  created_at: string;
  applied_at: string;
  expires_at: string | null;
  position: string;
  company: string;
  status: number;
  link: string;
}

const exampleData: JobApplication[] = [
  {
    id: 7,
    user_id: "0e756a42-675b-484d-81e8-e4113d27b6e2",
    created_at: "2025-08-06T23:47:13.981503+00:00",
    applied_at: "2025-08-07",
    expires_at: null,
    position: "test 4",
    company: "test 4",
    status: 6,
    link: ""
  },
  {
    id: 6,
    user_id: "0e756a42-675b-484d-81e8-e4113d27b6e2",
    created_at: "2025-08-06T23:44:07.972831+00:00",
    applied_at: "2025-08-07",
    expires_at: null,
    position: "test 2",
    company: "test 3",
    status: 7,
    link: ""
  },
  {
    id: 5,
    user_id: "0e756a42-675b-484d-81e8-e4113d27b6e2",
    created_at: "2025-08-06T23:05:50.116898+00:00",
    applied_at: "2025-08-07",
    expires_at: null,
    position: "test 2",
    company: "test 2",
    status: 6,
    link: ""
  },
  {
    id: 4,
    user_id: "0e756a42-675b-484d-81e8-e4113d27b6e2",
    created_at: "2025-08-06T22:57:54.05042+00:00",
    applied_at: "2025-08-06",
    expires_at: null,
    position: "test",
    company: "test",
    status: 5,
    link: ""
  }
];

const columns: ColumnDef<JobApplication>[] = [
  {
    accessorKey: "position",
    header: "Position",
  },
  {
    accessorKey: "company",
    header: "Company",
  },
  {
    accessorKey: "applied_at",
    header: "Applied Date",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "created_at",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString();
    },
  },
];

export function ExampleDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const table = useReactTable({
    data: exampleData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      globalFilter,
      columnVisibility,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-card text-card-foreground px-3 rounded-lg border hover:border-gray-500 transition-all duration-1000">
        <div className="flex items-center py-4">
          <Input
            placeholder="search..."
            value={table.getState().globalFilter ?? ""}
            onChange={(e) => table.setGlobalFilter(String(e.target.value))}
            className="max-w-sm text-primary-foreground"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="columns" className="ml-auto border">
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card-foreground text-card" align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize focus:bg-hover focus:text-card-foreground"
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

        <Table>
          <TableHeader className="">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="bg-card text-card-foreground">
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
            {table.getRowModel().rows.map((row) => (
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}