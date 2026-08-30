"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api, getStoredUser, subscribeAuth } from "@/lib/api-client";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/income", label: "Income" },
  { href: "/expenses", label: "Expenses" },
  { href: "/loans", label: "Loans / EMI" },
  { href: "/history", label: "History" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const sync = () => setName(getStoredUser()?.name ?? "");
    sync();
    return subscribeAuth(sync);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  async function logout() {
    await api.logout();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-bg">
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-dark text-white transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs tracking-[0.2em] text-accent uppercase">FINPILOT AI</p>
          <p className="mt-1 text-lg font-semibold">Personal finance</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm ${
                  active ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-4 text-sm text-white/70">
          Prototype foundation — calculations are deterministic, not AI.
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur">
          <button
            type="button"
            className="rounded-md border border-line px-3 py-1.5 text-sm md:hidden"
            onClick={() => setOpen(true)}
          >
            Menu
          </button>
          <p className="hidden text-sm text-muted md:block">Track money first. Plan later.</p>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-medium">{name}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-bg"
            >
              Log out
            </button>
          </div>
        </header>
        <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
