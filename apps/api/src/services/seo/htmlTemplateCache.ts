import axios from "axios";

// The built SPA shell (with its content-hashed <script>/<link> tags) lives in the
// `web` container, not this one — nginx routes /salon/:slug here so we can inject
// per-tenant meta tags before a crawler ever sees the response, but the actual
// markup still has to come from wherever Vite's build output really is. Fetching
// it once per TTL window (rather than per request) keeps a crawler hitting many
// salon pages back-to-back from hammering the web container for the same bytes.
const TTL_MS = 5 * 60 * 1000;
// Same-network container name from docker-compose — unreachable outside Docker,
// which is fine, this only ever runs server-side.
const WEB_ORIGIN = "http://web";

let cached: { html: string; fetchedAt: number } | null = null;

export async function getIndexHtmlTemplate(): Promise<string> {
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.html;
  }

  const res = await axios.get<string>(`${WEB_ORIGIN}/index.html`, {
    responseType: "text",
    timeout: 5000,
  });
  cached = { html: res.data, fetchedAt: Date.now() };
  return cached.html;
}
