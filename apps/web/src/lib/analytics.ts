// The gtag bootstrap (dataLayer + config call) lives statically in
// index.html, not here — Google's own tag-detection reads raw HTML, not the
// rendered DOM, so it has to be a real <script> tag in the shipped page, not
// something injected at runtime. That block is stripped in dev (see
// vite.config.ts), so window.gtag is only ever defined in production.
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackPageView(path: string) {
  if (typeof window.gtag !== "function") return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
