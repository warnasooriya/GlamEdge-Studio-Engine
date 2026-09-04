import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

// Public pages are reachable directly from a QR code, a shared payment link or a
// search result, so a visitor often arrives with no history to go "back" to.
// A real link home beats relying on the browser's back button.
export function BackToSite({
  to = "/",
  label = "All salons",
  tone = "onDark",
  className = "",
}: {
  to?: string;
  label?: string;
  tone?: "onDark" | "onLight";
  className?: string;
}) {
  const styles =
    tone === "onDark"
      ? "bg-white/10 text-cream-50 ring-1 ring-white/15 backdrop-blur-sm hover:bg-white/20"
      : "text-neutral-500 hover:text-brand-700";

  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${styles} ${className}`}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      {label}
    </Link>
  );
}
