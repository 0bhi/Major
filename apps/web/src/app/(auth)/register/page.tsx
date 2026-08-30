"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";
import { ErrorBanner, Field, inputClass } from "@/components/Ui";
import { api } from "@/lib/api-client";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name")).trim();
    const email = String(form.get("email"));
    const password = String(form.get("password"));
    const confirm = String(form.get("confirm"));
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    setPending(true);
    try {
      await api.register({ name, email, password });
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <MarketingNav />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Your data is stored per user in PostgreSQL.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-2xl border border-line bg-surface p-6">
          <ErrorBanner message={error} />
          <Field label="Name">
            <input className={inputClass} name="name" autoComplete="name" required minLength={2} />
          </Field>
          <Field label="Email">
            <input className={inputClass} name="email" type="email" autoComplete="email" required />
          </Field>
          <Field label="Password">
            <input
              className={inputClass}
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </Field>
          <Field label="Confirm password">
            <input
              className={inputClass}
              name="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </Field>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Creating account…" : "Register"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted">
          Already registered?{" "}
          <Link href="/login" className="font-medium text-brand">
            Login
          </Link>
        </p>
      </main>
      <MarketingFooter />
    </div>
  );
}
