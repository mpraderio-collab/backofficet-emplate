import { createCustomer } from "../actions";
import { CustomerForm } from "../CustomerForm";

export default function NewCustomerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-ink">Nuevo cliente</h1>
      <div className="mt-6">
        <CustomerForm action={createCustomer} submitLabel="Crear cliente" />
      </div>
    </div>
  );
}
