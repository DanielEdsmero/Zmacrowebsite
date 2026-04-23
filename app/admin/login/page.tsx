import { LoginForm } from "./login-form";

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams?: { error?: string };
}) {
  const initialError =
    searchParams?.error === "not_authorized"
      ? "NOT AUTHORIZED. This account is not the admin."
      : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="mb-6 text-lg uppercase tracking-widest">
        &gt; admin_login
      </h1>
      <LoginForm initialError={initialError} />
    </main>
  );
}
