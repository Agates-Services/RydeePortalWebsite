import { describe, expect, it } from "vitest";
import { renderHook } from "@testing-library/react";
import { stringCompare, useTableView } from "@/lib/useTableView";

interface Row {
  name: string;
  age: number;
}

const rows: Row[] = [
  { name: "Charlie", age: 30 },
  { name: "Alice", age: 25 },
  { name: "Bob", age: 40 },
  { name: "Dan", age: 22 },
];

describe("useTableView", () => {
  const passAll = [(_r: Row) => true];
  const byName = (a: Row, b: Row) => stringCompare(a.name, b.name, "asc");

  it("returns empty arrays and pageCount=1 when rows is null", () => {
    const { result } = renderHook(() => useTableView<Row>(null, passAll, byName, 1, 10));
    expect(result.current.filteredRows).toEqual([]);
    expect(result.current.pageRows).toEqual([]);
    expect(result.current.pageCount).toBe(1);
    expect(result.current.currentPage).toBe(1);
  });

  it("filters, sorts, and paginates", () => {
    const filters = [(r: Row) => r.age >= 25];
    const { result } = renderHook(() => useTableView<Row>(rows, filters, byName, 1, 2));
    expect(result.current.filteredRows.map((r) => r.name)).toEqual(["Alice", "Bob", "Charlie"]);
    expect(result.current.pageRows.map((r) => r.name)).toEqual(["Alice", "Bob"]);
    expect(result.current.pageCount).toBe(2);
  });

  it("clamps currentPage when page > pageCount", () => {
    const { result } = renderHook(() => useTableView<Row>(rows, passAll, byName, 99, 10));
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageRows).toHaveLength(4);
  });

  it("stringCompare respects direction", () => {
    expect(stringCompare("a", "b", "asc")).toBeLessThan(0);
    expect(stringCompare("a", "b", "desc")).toBeGreaterThan(0);
    expect(stringCompare(null, "", "asc")).toBe(0);
  });
});
