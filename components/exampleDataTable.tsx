"use client";

import { Input } from "./ui/input";
import { columns } from "./columns";
import type { JobApplication } from '../types/jobApplication';

import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from "./ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem } from "./ui/dropdown-menu";
import { flexRender, SortingState, useReactTable, getCoreRowModel, VisibilityState, getSortedRowModel, getFilteredRowModel, getPaginationRowModel } from "@tanstack/react-table";


const exampleData: JobApplication[] = [
  {
    id: 7,
    user_id: "0e756a42-675b-484d-81e8-e4113d27b6e2",
    created_at: "2025-08-06T23:47:13.981503+00:00",
    applied_at: "2025-08-07",
    expires_at: undefined,
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
    expires_at: undefined,
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
    expires_at: undefined,
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
    expires_at: undefined,
    position: "test",
    company: "test",
    status: 5,
    link: ""
  }
];

export function ExampleDataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState([]);

  const table = useReactTable({
    data: exampleData,
    columns: columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-card text-card-foreground px-3 rounded-lg transition-all duration-1000">
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