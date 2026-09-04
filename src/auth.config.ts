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
      const isLoginPage = request.nextUrl.pathname === "/login";
      if (isLoginPage) return true;
      return !!auth?.user;
    },
  },
};
