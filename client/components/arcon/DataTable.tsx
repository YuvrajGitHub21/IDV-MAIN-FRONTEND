import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export type Column<T extends Record<string, any>> = {
  key: keyof T;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
};

export interface DataTableProps<T extends Record<string, any>> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = "No data available.",
  pageSize = 10,
  className,
}: DataTableProps<T>) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageRows = data.slice(start, start + pageSize);

  React.useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  return (
    <div
      className={cn(
        "rounded-[12px] border border-arcon-gray-border bg-white",
        className,
      )}
    >
      <div className="relative max-h-[480px] overflow-auto">
        <table
          className="w-full text-left border-collapse"
          aria-label="data table"
        >
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="text-sm text-arcon-gray-secondary">
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  scope="col"
                  className={cn(
                    "px-4 py-3 font-semibold border-b border-arcon-gray-border bg-white",
                    col.className,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-sm text-arcon-gray-primary">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <tr key={i} className="even:bg-arcon-panel">
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className="px-4 py-3 border-b border-arcon-gray-border"
                    >
                      <Skeleton className="h-4 w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-arcon-gray-primary font-roboto">
                      {emptyMessage}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((row, idx) => (
                <tr
                  key={idx}
                  className="odd:bg-white even:bg-arcon-panel hover:bg-[#2563EB0D] focus-within:bg-[#2563EB0D]"
                >
                  {columns.map((col, j) => (
                    <td
                      key={j}
                      className="px-4 py-3 border-b border-arcon-gray-border"
                    >
                      {col.render
                        ? col.render(row)
                        : String(row[col.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <p className="text-xs text-arcon-gray-secondary font-roboto">
          Page {page} of {totalPages}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="h-8 rounded-control border-arcon-gray-border text-arcon-gray-primary"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            Prev
          </Button>
          <Button
            variant="outline"
            className="h-8 rounded-control border-arcon-gray-border text-arcon-gray-primary"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
