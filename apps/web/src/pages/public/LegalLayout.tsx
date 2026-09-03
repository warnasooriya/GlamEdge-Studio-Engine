import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { GlamEdgeLogo } from "@/components/shared/GlamEdgeLogo";
import { SiteFooter } from "@/components/shared/SiteFooter";
import { SITE } from "@/lib/siteInfo";

// Derived from SITE so the policy body, the support page and the footer can
// never drift apart — Apple reads these pages during review and compares them
// against the App Store listing.
export const LEGAL = {
  legalName: SITE.legalName,
  email: SITE.email,
  address: SITE.addressLines.join(", "),
  hostingRegion: SITE.hostingRegion,
  financialRetentionYears: SITE.financialRetentionYears,
  lastUpdated: SITE.legalLastUpdated,
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

      <SiteFooter />

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
