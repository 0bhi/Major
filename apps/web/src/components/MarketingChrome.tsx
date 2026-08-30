import Link from "next/link";

export function MarketingNav() {
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-lg font-semibold tracking-tight text-brand-dark">FINPILOT</span>
          <span className="text-xs font-medium tracking-[0.18em] text-accent">AI</span>
        </Link>
        <nav className="flex items-center gap-3 text-sm">
          <Link href="/login" className="text-muted hover:text-ink">
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted">
        FINPILOT AI — personal finance, built in stages. Not financial advice.
      </div>
    </footer>
  );
}
