# Backoffice

Gestión interna: productos, clientes, proveedores, ventas, stock y cuentas
corrientes (con pagos parciales) tanto de clientes como de proveedores.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Prisma + PostgreSQL (Neon)
- NextAuth v5 (Credentials) — varios usuarios, mismo nivel de acceso

## Desarrollo local

```bash
npm install
npm run db:push      # sincroniza el schema con la base
npm run dev
```

Variables de entorno necesarias (`.env`):

- `DATABASE_URL` / `DATABASE_URL_UNPOOLED` — conexión a Postgres (Neon)
- `AUTH_SECRET` — secreto de NextAuth

## Crear el primer usuario

```bash
SEED_USER_EMAIL="vos@ejemplo.com" SEED_USER_NAME="Tu nombre" SEED_USER_PASSWORD="algo-seguro" npx tsx prisma/seed.ts
```

Una vez logueado, se pueden agregar más usuarios desde la sección
**Usuarios** dentro del sistema.

## Modelo de negocio

- **Ventas**: cada venta descuenta stock y genera un cargo en la cuenta
  corriente del cliente. Los pagos (totales o parciales) se registran por
  separado y van cancelando el saldo.
- **Pedidos a proveedores**: pasan por los estados Pendiente → Enviado →
  Recibido (o Cancelado). Al marcarse como "Recibido" se suma el stock y se
  genera el cargo correspondiente en la cuenta corriente del proveedor.
