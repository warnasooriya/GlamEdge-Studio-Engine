import { Request, Response } from "express";
import { prisma } from "@/config/prisma";
import { env } from "@/config/env";
import { publicTenantWhere, isPubliclyVisible } from "@/utils/publicTenant";
import { storageProvider } from "@/services/storage";
import { getIndexHtmlTemplate } from "@/services/seo/htmlTemplateCache";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function toJsonLdScript(data: unknown): string {
  // JSON.stringify alone doesn't escape "<", so a salon name/description
  // containing "</script>" could break out of the block early — an HTML parser
  // doesn't know it's still inside JSON at that point.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

// Renders the built SPA shell with per-salon <head> tags injected, so a crawler
// that never executes JS (most of them, besides Google's delayed render pass)
// still sees the salon's real name/description/rating on the very first fetch —
// otherwise every /salon/:slug request returns the same generic empty shell,
// and there is nothing to index under that salon's own name at all.
export async function renderSalonPage(req: Request, res: Response) {
  const { slug } = req.params;
  const template = await getIndexHtmlTemplate();

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      salonName: true,
      slug: true,
      status: true,
      isActive: true,
      subscriptionExpiresAt: true,
      logoUrl: true,
      address: true,
      contactPhone: true,
      services: { where: { isActive: true }, select: { name: true }, take: 5 },
    },
  });

  // Not found / hidden: serve the plain shell unmodified so the SPA's own
  // client-side "not found" screen still renders correctly for real visitors —
  // this route only adds tags, it never changes what actually gets served.
  if (!tenant || !isPubliclyVisible(tenant)) {
    res.set("Content-Type", "text/html; charset=utf-8");
    return res.send(template);
  }

  const [ratingRow] = await prisma.$queryRaw<Array<{ avgRating: number; reviewCount: bigint }>>`
    SELECT AVG(rating) AS avgRating, COUNT(*) AS reviewCount FROM reviews WHERE tenantId = ${tenant.id}
  `;
  const avgRating = Number(ratingRow?.avgRating ?? 0);
  const reviewCount = Number(ratingRow?.reviewCount ?? 0);

  const logoUrl = tenant.logoUrl ? await storageProvider.resolveUrl(tenant.logoUrl) : null;
  const pageUrl = `${env.publicUrl}/salon/${tenant.slug}`;
  const serviceNames = tenant.services.map((s) => s.name);

  const title = `${tenant.salonName}${tenant.address ? ` — ${tenant.address.split(",").pop()?.trim()}` : ""} | GlamEdge`;
  const descriptionParts = [
    `Book ${tenant.salonName} on GlamEdge.`,
    serviceNames.length ? `Services: ${serviceNames.join(", ")}.` : null,
    reviewCount > 0 ? `Rated ${avgRating.toFixed(1)}/5 from ${reviewCount} review${reviewCount === 1 ? "" : "s"}.` : null,
    tenant.address ? `Located at ${tenant.address}.` : null,
  ].filter(Boolean);
  const description = descriptionParts.join(" ").slice(0, 300);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BeautySalon",
    name: tenant.salonName,
    url: pageUrl,
    ...(logoUrl ? { image: logoUrl } : {}),
    ...(tenant.address ? { address: { "@type": "PostalAddress", streetAddress: tenant.address } } : {}),
    ...(tenant.contactPhone ? { telephone: tenant.contactPhone } : {}),
    ...(reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount,
          },
        }
      : {}),
  };

  const headInjection = `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(pageUrl)}" />
    <meta property="og:type" content="business.business" />
    <meta property="og:title" content="${esc(tenant.salonName)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(pageUrl)}" />
    ${logoUrl ? `<meta property="og:image" content="${esc(logoUrl)}" />` : ""}
    <meta name="twitter:card" content="summary${logoUrl ? "_large_image" : ""}" />
    <meta name="twitter:title" content="${esc(tenant.salonName)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    ${logoUrl ? `<meta name="twitter:image" content="${esc(logoUrl)}" />` : ""}
    <script type="application/ld+json">${toJsonLdScript(jsonLd)}</script>
  `;

  // Strip rather than append: the shell's static homepage tags (title,
  // description, canonical, OG/Twitter) would otherwise sit alongside these,
  // and duplicate canonical/og:url tags leave crawlers guessing which is
  // authoritative for this page.
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, "")
    .replace(/<meta\s+name="description"[\s\S]*?\/>/i, "")
    .replace(/<link\s+rel="canonical"[\s\S]*?\/>/i, "")
    .replace(/<meta\s+property="og:[\s\S]*?\/>/gi, "")
    .replace(/<meta\s+name="twitter:[\s\S]*?\/>/gi, "")
    .replace("</head>", `${headInjection}\n</head>`);

  res.set("Content-Type", "text/html; charset=utf-8");
  res.set("Cache-Control", "public, max-age=300");
  return res.send(html);
}

export async function renderSitemap(_req: Request, res: Response) {
  const tenants = await prisma.tenant.findMany({
    where: publicTenantWhere(),
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const urls = [
    `<url><loc>${esc(env.publicUrl)}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...tenants.map(
      (t) =>
        `<url><loc>${esc(env.publicUrl)}/salon/${esc(t.slug)}</loc><lastmod>${t.updatedAt.toISOString().slice(0, 10)}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  res.set("Content-Type", "application/xml; charset=utf-8");
  res.set("Cache-Control", "public, max-age=3600");
  return res.send(xml);
}
