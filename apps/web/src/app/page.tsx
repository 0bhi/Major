import Link from "next/link";
import { MarketingFooter, MarketingNav } from "@/components/MarketingChrome";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <MarketingNav />
      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
          <div>
            <p className="text-xs font-semibold tracking-[0.22em] text-brand uppercase">
              Stage 1 foundation
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              Record your money. Then understand it.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              FINPILOT AI starts as a reliable personal-finance workspace: income, expenses,
              loans and a live dashboard. AI planning comes later — on top of real numbers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Get started
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium hover:bg-white"
              >
                Login
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
            <p className="text-sm font-medium text-muted">What you can do now</p>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="rounded-lg bg-bg px-4 py-3">Track salary, rent, freelance and other income</li>
              <li className="rounded-lg bg-bg px-4 py-3">Categorise every expense</li>
              <li className="rounded-lg bg-bg px-4 py-3">Monitor EMIs, remaining balance and progress</li>
              <li className="rounded-lg bg-bg px-4 py-3">See savings rate and a rule-based health score</li>
            </ul>
          </div>
        </section>
        <section className="border-t border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-3">
            {[
              { step: "Track", copy: "Capture income, spending and debt in one place." },
              { step: "Understand", copy: "Totals, charts and a health score from your own data." },
              { step: "Plan", copy: "Goals, scenarios and an AI CFO — later stages, same foundation." },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-line p-5">
                <p className="text-xs tracking-[0.18em] text-accent uppercase">{item.step}</p>
                <p className="mt-2 text-sm text-muted">{item.copy}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
