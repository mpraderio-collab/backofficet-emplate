"use client";

import { exportRowsToCsv } from "@/components/ExportCsvButton";

type ExportItem = {
  productName: string;
  characteristics: string;
  quantity: number;
  unitCost: number;
  subtotal: number;
};

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
    exportRowsToCsv(fileName, [
      [`Pedido a ${supplierName}`],
      [`Fecha del pedido: ${orderDate}`],
      [],
      header,
      ...rows,
      [],
      ["Total", "", "", "", total],
    ]);
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
