import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import { GlamEdgeLogo } from "@/components/shared/GlamEdgeLogo";
import { SITE } from "@/lib/siteInfo";

// Deliberately dark in both themes: it closes the page against the same
// gradient-hero plum the landing header opens with, so light mode doesn't end
// on an unbounded cream void.
export function SiteFooter() {
  return (
    <footer className="mt-16 bg-plum-800 text-cream-100/70">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
                <GlamEdgeLogo className="h-5 w-5 text-white" />
              </span>
              <span className="font-display text-lg font-semibold text-cream-50">GlamEdge</span>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed">{SITE.tagline}</p>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Browse salons & spas near you, book in seconds, and manage your own salon or spa with the GlamEdge Owner app.
            </p>
          </div>

          {/* Links */}
          <nav aria-label="Footer">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cream-100/45">Company</h2>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/" className="transition hover:text-brand-300">Find salons</Link>
              </li>
              <li>
                <Link to="/support" className="transition hover:text-brand-300">Support</Link>
              </li>
              <li>
                <Link to="/privacy" className="transition hover:text-brand-300">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/auth" className="transition hover:text-brand-300">List your salon</Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-cream-100/45">Get in touch</h2>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                <a href={SITE.phoneHref} className="transition hover:text-brand-300">
                  {SITE.phoneDisplay}
                </a>
              </li>
              <li className="flex gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                <a href={`mailto:${SITE.email}`} className="break-all transition hover:text-brand-300">
                  {SITE.email}
                </a>
              </li>
              <li className="flex gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" aria-hidden="true" />
                <address className="not-italic leading-relaxed">
                  {SITE.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            &copy; {new Date().getFullYear()} {SITE.legalName}. All rights reserved.
          </p>
          <div className="flex gap-5">
            <Link to="/privacy" className="transition hover:text-brand-300">Privacy</Link>
            <Link to="/support" className="transition hover:text-brand-300">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
