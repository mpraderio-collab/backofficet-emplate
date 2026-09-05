"use client";

type ExportItem = {
  productName: string;
  characteristics: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
};

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function ExportActions({
  fileName,
  supplierName,
  orderDate,
  items,
  total,
}: {
  fileName: string;
  supplierName: string;
  orderDate: string;
  items: ExportItem[];
  total: number;
}) {
  function exportToExcel() {
    const header = ["Producto", "Características", "Cantidad", "Costo unitario", "Subtotal"];
    const rows = items.map((item) => [
      item.productName,
      item.characteristics,
      item.quantity,
      item.unitCost,
      item.subtotal,
    ]);
    const lines = [
      [`Pedido a ${supplierName}`],
      [`Fecha del pedido: ${orderDate}`],
      [],
      header,
      ...rows,
      [],
      ["Total", "", "", "", total],
    ];
    const csv = lines.map((line) => line.map(csvCell).join(";")).join("\n");
    // BOM para que Excel detecte UTF-8 y no rompa los acentos.
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="print:hidden mt-4 flex gap-3">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-lg border border-border-input bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
      >
        Imprimir / PDF
      </button>
      <button
        type="button"
        onClick={exportToExcel}
        className="rounded-lg border border-border-input bg-bg px-4 py-2 text-sm font-semibold text-ink hover:bg-surface"
      >
        Exportar a Excel
      </button>
    </div>
  );
}
