import { createSupplier } from "../actions";
import { SupplierForm } from "../SupplierForm";

export default function NewSupplierPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Nuevo proveedor</h1>
      <div className="mt-6">
        <SupplierForm action={createSupplier} submitLabel="Crear proveedor" />
      </div>
    </div>
  );
}
