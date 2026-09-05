import type { DefaultSession } from "next-auth";

// session.user.id no viene tipado por defecto — se agrega en los callbacks
// jwt/session de src/auth.ts. Sin esto, cualquier lectura de
// session.user.id sería `any`/error de tipos.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
