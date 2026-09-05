import { z } from "zod";
import { paymentMethods } from "./payment-method";

export const productSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(160),
  sku: z
    .string()
    .trim()
    .max(60)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  price: z.coerce
    .number({ message: "El precio tiene que ser un número" })
    .int("El precio no puede tener centavos")
    .nonnegative("El precio no puede ser negativo"),
  cost: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().nonnegative().optional(),
  ),
  stock: z.coerce.number().nonnegative().default(0),
  minStock: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().nonnegative().optional(),
  ),
  supplierId: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  fractionUnit: z
    .string()
    .trim()
    .max(20)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  unitSize: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().positive().optional(),
  ),
  fractionPrice: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().nonnegative().optional(),
  ),
  brand: z.string().trim().max(80).optional().or(z.literal("")),
  animalType: z.string().trim().max(60).optional().or(z.literal("")),
  animalSize: z.string().trim().max(60).optional().or(z.literal("")),
  animalWeight: z.string().trim().max(60).optional().or(z.literal("")),
}).refine((data) => !data.fractionUnit || (data.unitSize && data.fractionPrice != null), {
  message: "Completá el tamaño de la unidad y el precio por fracción",
  path: ["unitSize"],
});

export const customerSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(160),
  taxId: z.string().trim().max(30).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("El email no es válido")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
});

export const supplierSchema = customerSchema;

export const ledgerPaymentSchema = z.object({
  amount: z.coerce
    .number({ message: "El monto tiene que ser un número" })
    .int("El monto no puede tener centavos")
    .positive("El monto tiene que ser mayor a cero"),
  paymentMethod: z.enum(paymentMethods).default("cash"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const saleItemSchema = z.object({
  productId: z.string().min(1),
  saleUnit: z.enum(["unit", "fraction"]).default("unit"),
  quantity: z.coerce.number().positive(),
  unitPrice: z.coerce.number().int().nonnegative(),
  stockDelta: z.coerce.number().positive(),
});

export const saleSchema = z.object({
  customerId: z.string().min(1, "Elegí un cliente"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  items: z.array(saleItemSchema).min(1, "Agregá al menos un producto"),
  initialPayment: z.coerce.number().int().nonnegative().optional().default(0),
  initialPaymentMethod: z.enum(paymentMethods).default("cash"),
});

export const purchaseOrderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive(),
  unitCost: z.coerce.number().int().nonnegative(),
});

export const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Elegí un proveedor"),
  note: z.string().trim().max(300).optional().or(z.literal("")),
  items: z.array(purchaseOrderItemSchema).min(1, "Agregá al menos un producto"),
  orderDate: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.date().optional(),
  ),
});

export const purchaseOrderStatuses = ["pending", "sent", "received", "cancelled"] as const;

export const receivePurchaseOrderItemSchema = z.object({
  itemId: z.string().min(1),
  receivedQuantity: z.coerce.number().nonnegative(),
  newCost: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : val),
    z.coerce.number().int().nonnegative().optional(),
  ),
});

export const receivePurchaseOrderSchema = z.object({
  items: z.array(receivePurchaseOrderItemSchema).min(1),
});

export const expenseTypeSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80),
});

export const expenseSchema = z.object({
  expenseTypeId: z.string().min(1, "Elegí un tipo de gasto"),
  amount: z.coerce
    .number({ message: "El monto tiene que ser un número" })
    .int("El monto no puede tener centavos")
    .positive("El monto tiene que ser mayor a cero"),
  date: z.coerce.date({ message: "Elegí una fecha válida" }),
  referenceMonth: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Elegí un mes válido")
    .transform((value) => new Date(`${value}-01T00:00:00.000Z`)),
  paymentMethod: z.enum(paymentMethods).default("cash"),
  isRecurring: z.coerce.boolean().default(false),
  note: z.string().trim().max(300).optional().or(z.literal("")),
});

export const userSchema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(120),
  email: z.string().trim().email("El email no es válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
