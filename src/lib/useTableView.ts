import { useMemo } from "react";

export function useTableView<T>(
  rows: readonly T[] | null,
  filters: ReadonlyArray<(row: T) => boolean>,
  compare: (a: T, b: T) => number,
  page: number,
  pageSize: number,
): {
  filteredRows: T[];
  pageRows: T[];
  pageCount: number;
  currentPage: number;
  pageStart: number;
} {
  const filteredRows = useMemo(() => {
    if (!rows) return [] as T[];
    let out: T[] = rows.slice();
    for (const f of filters) out = out.filter(f);
    out.sort(compare);
    return out;
  }, [rows, filters, compare]);

  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageRows = filteredRows.slice(pageStart, pageStart + pageSize);

  return { filteredRows, pageRows, pageCount, currentPage, pageStart };
}

export function stringCompare(a: unknown, b: unknown, dir: "asc" | "desc"): number {
  const av = a ?? "";
  const bv = b ?? "";
  const cmp = String(av).localeCompare(String(bv), undefined, {
    numeric: true,
    sensitivity: "base",
  });
  return dir === "asc" ? cmp : -cmp;
}
