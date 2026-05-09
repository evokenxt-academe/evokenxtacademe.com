/**
 * Reusable Admin DataTable Component
 * ==================================
 * Wraps TanStack Table with shadcn UI for admin tables
 */

"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import type { ColumnDef, Table as TanStackTable } from "@tanstack/react-table";
import { useReactTable } from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminDataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
}

export function AdminDataTable<TData>({
  columns,
  data,
  isLoading = false,
  searchPlaceholder = "Search...",
  onSearch,
}: AdminDataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onPaginationChange: setPagination,
    globalFilterFn: "includesString",
  });

  const handleSearch = (value: string) => {
    setGlobalFilter(value);
    onSearch?.(value);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex gap-2">
        <Input
          placeholder={searchPlaceholder}
          value={globalFilter}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-semibold text-muted-foreground"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="hover:bg-transparent">
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-border/50 hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  No results found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          Showing{" "}
          {table.getState().pagination.pageIndex *
            table.getState().pagination.pageSize +
            1}{" "}
          to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) *
              table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length,
          )}{" "}
          of {table.getFilteredRowModel().rows.length} results
        </div>
        <div className="flex gap-2">
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
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
