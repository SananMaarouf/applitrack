import { useState } from "react";
import { columns } from "./exampleColumns";
import type { JobApplication } from '../../types/jobApplication';
import { Table, TableRow, TableBody, TableCell, TableHead, TableHeader } from "../ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { flexRender, SortingState, useReactTable, getCoreRowModel, getSortedRowModel, getFilteredRowModel } from "@tanstack/react-table";


const exampleData: JobApplication[] = [
	{
		"id": 6,
		"user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
		"created_at": "2025-08-06T23:44:07.972831+00:00",
		"applied_at": "2025-04-07",
		"expires_at": undefined,
		"position": "Web developer",
		"company": "Big Tech Co",
		"status": 7,
		"link": ""
	},
	{
		"id": 5,
		"user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
		"created_at": "2025-08-06T23:05:50.116898+00:00",
		"applied_at": "2025-05-07",
		"expires_at": undefined,
		"position": "Data analyst",
		"company": "Evil corp",
		"status": 6,
		"link": ""
	},
	{
		"id": 4,
		"user_id": "0e756a42-675b-484d-81e8-e4113d27b6e2",
		"created_at": "2025-08-06T22:57:54.05042+00:00",
		"applied_at": "2025-06-06",
		"expires_at": undefined,
		"position": "Groundskeeper",
		"company": "Springfield elementary",
		"status": 5,
		"link": ""
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
      columnVisibility: {
        link: false,
        actions: false,
        expires: false,
        applied: false,
        company: false,
      }
    },
    onGlobalFilterChange: setGlobalFilter,
  });

  return (
    <Card className="w-full p-0 max-w-6xl mx-auto overflow-hidden">
      <CardContent className="p-0">
        <Table>
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
          <TableBody className="">
            {table.getRowModel().rows.map((row) => (
              <TableRow
                className="hover:text-foreground hover:bg-primary/10"
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
      </CardContent>
    </Card>
  );
}