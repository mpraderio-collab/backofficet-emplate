"use client";

import type { SortDirection } from "@/lib/useSortableList";

export function SortHeader<K extends string>({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSort,
  align,
  className,
  buttonClassName,
}: {
  label: string;
  columnKey: K;
  sortKey: K;
  sortDir: SortDirection;
  onSort: (key: K) => void;
  align?: "right";
  className?: string;
  buttonClassName?: string;
}) {
  const active = columnKey === sortKey;
  return (
    <th className={`px-4 py-3 ${align === "right" ? "text-right" : ""} ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={`inline-flex items-center gap-1 hover:text-ink ${active ? "text-ink" : ""} ${buttonClassName ?? ""}`}
      >
        {label}
        <span className="text-[10px] leading-none">
          {active ? (sortDir === "asc" ? "▲" : "▼") : ""}
        </span>
      </button>
    </th>
  );
}
