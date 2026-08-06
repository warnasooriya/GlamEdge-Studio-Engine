// GA4 is only loaded in production builds, never in dev — otherwise every
// local session would show up as live traffic in the real property.
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "G-9ZZB39T6H5";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let initialized = false;

export function initAnalytics() {
  if (initialized || !import.meta.env.PROD || !MEASUREMENT_ID) return;
  initialized = true;

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag("js", new Date());
  // send_page_view: false — this is a client-routed SPA, so the initial
  // config call would otherwise fire one page_view and then go silent on
  // every subsequent in-app navigation. trackPageView (below) sends them
  // all instead, including this first one.
  window.gtag("config", MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(path: string) {
  if (!initialized) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}
