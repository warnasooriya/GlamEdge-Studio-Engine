import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { GlamEdgeLogo } from "@/components/shared/GlamEdgeLogo";

// Details that appear verbatim on the published legal pages. Apple opens these
// URLs during App Review, so keep them accurate — a policy that contradicts the
// App Privacy answers in App Store Connect is a rejection.
export const LEGAL = {
  legalName: "GlamEdge",
  email: "support@glamedge.beauty",
  // Leave "" to hide the line entirely rather than print a placeholder.
  address: "",
  hostingRegion: "Singapore",
  financialRetentionYears: 6,
  lastUpdated: "3 September 2026",
};

export function LegalLayout({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-2 text-brand-800">
            <GlamEdgeLogo className="h-5 w-5" />
            <span className="text-sm font-semibold tracking-tight">GlamEdge</span>
          </Link>
          <Link to="/" className="flex items-center gap-1.5 text-sm text-neutral-500 transition hover:text-brand-700">
            <ArrowLeft className="h-4 w-4" />
            Back to site
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl">{title}</h1>
        {intro ? <p className="mt-3 text-base leading-relaxed text-neutral-600">{intro}</p> : null}
        <p className="mt-3 text-sm text-neutral-400">Last updated {LEGAL.lastUpdated}</p>
        <div className="mt-10 space-y-9">{children}</div>
      </main>

      <footer className="border-t border-neutral-200">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-x-6 gap-y-2 px-5 py-6 text-sm text-neutral-500">
          <Link to="/privacy" className="transition hover:text-brand-700">Privacy Policy</Link>
          <Link to="/support" className="transition hover:text-brand-700">Support</Link>
          <a href={`mailto:${LEGAL.email}`} className="transition hover:text-brand-700">{LEGAL.email}</a>
        </div>
      </footer>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-tight text-neutral-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-neutral-700">{children}</div>
    </section>
  );
}
