import type { NextAuthConfig } from "next-auth";

// Config liviana, compatible con Edge Runtime: sin providers (que arrastran
// Prisma + bcrypt, incompatibles con Edge y demasiado pesados para el límite
// de tamaño de una Edge Function). El middleware usa solo esto.
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      // La TV del local no puede loguearse: /signage y su API son públicas
      // a propósito (ver api/signage/route.ts — nunca exponen costo/margen).
      const isPublic =
        pathname === "/login" || pathname === "/signage" || pathname.startsWith("/api/signage");
      if (isPublic) return true;
      return !!auth?.user;
    },
  },
};
