"use client";

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function exportRowsToCsv(fileName: string, rows: (string | number)[][]) {
  const csv = rows.map((line) => line.map(csvCell).join(";")).join("\n");
  // BOM para que Excel detecte UTF-8 y no rompa los acentos.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportCsvButton({
  fileName,
  rows,
  label = "Exportar a Excel",
  className,
}: {
  fileName: string;
  rows: (string | number)[][];
  label?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => exportRowsToCsv(fileName, rows)}
      className={
        className ??
        "rounded-lg border border-border-input bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
      }
    >
      {label}
    </button>
  );
}
