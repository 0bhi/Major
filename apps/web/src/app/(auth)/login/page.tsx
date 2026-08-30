"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { ErrorBanner, Field, inputClass } from "@/components/Ui";
import { api } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      await api.login({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <MarketingNav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-muted">Log in to your FINPILOT workspace.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-line bg-surface p-6">
          <ErrorBanner message={error} />
          <Field label="Email">
            <input className={inputClass} name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Signing in…" : "Login"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted">
          No account?{" "}
          <Link href="/register" className="font-medium text-brand">
            Register
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
