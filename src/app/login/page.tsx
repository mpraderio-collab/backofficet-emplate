import { redirect } from "next/navigation";
import { signIn, auth } from "@/auth";
import { AuthError } from "next-auth";

async function login(formData: FormData) {
  "use server";
  const email = formData.get("email");
  const password = formData.get("password");
  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw error;
  }
}

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await auth();
  if (session?.user) redirect("/");

  const searchParams = await props.searchParams;
  const hasError = searchParams?.error === "1";

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="w-full max-w-[380px] rounded-2xl border border-line bg-bg p-8">
        <h1 className="text-2xl font-bold text-ink">Backoffice</h1>
        <p className="mt-1 text-sm text-ink-soft">Ingresá con tu cuenta.</p>
        <form action={login} className="mt-6 flex flex-col gap-4">
          {hasError && (
            <p className="rounded-lg border border-err-line bg-err-bg px-3 py-2 text-sm text-err-ink">
              Email o contraseña incorrectos.
            </p>
          )}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-semibold text-ink">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="focus-accent rounded-lg border border-border-input bg-bg px-3.5 py-2.5 text-sm outline-none"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-semibold text-ink">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="focus-accent rounded-lg border border-border-input bg-bg px-3.5 py-2.5 text-sm outline-none"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
