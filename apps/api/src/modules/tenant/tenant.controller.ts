import { Response, Request } from "express";
import { z } from "zod";
import { v4 as uuid } from "uuid";
import { Prisma } from "@prisma/client";
import { prisma } from "@/config/prisma";
import { HttpError } from "@/middlewares/errorHandler";
import { AuthRequest } from "@/middlewares/requireAuth";
import { parsePagination, paginationMeta } from "@/utils/pagination";
import { storageProvider } from "@/services/storage";
import { Post } from "@/models/Post";

const TENANT_CARD_SELECT = {
  id: true,
  salonName: true,
  slug: true,
  logoUrl: true,
  address: true,
  services: { where: { isActive: true }, orderBy: { createdAt: "asc" as const } },
};

async function resolveTenantLogos<T extends { logoUrl: string | null }>(tenants: T[]): Promise<T[]> {
  return Promise.all(
    tenants.map(async (t) => ({ ...t, logoUrl: t.logoUrl ? await storageProvider.resolveUrl(t.logoUrl) : t.logoUrl }))
  );
}

// A salon's public portfolio ("Feed" posts, stored in Mongo) previewed on its listing card:
// up to 3 most-recent photos plus a total count, so shoppers see proof of work before clicking in.
async function attachPortfolioPreviews<T extends { id: string }>(
  tenants: T[]
): Promise<(T & { portfolioPreview: string[]; portfolioCount: number })[]> {
  const ids = tenants.map((t) => t.id);
  if (!ids.length) return [];

  const grouped = await Post.aggregate([
    { $match: { tenantId: { $in: ids } } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: "$tenantId", mediaArrays: { $push: "$media" }, postCount: { $sum: 1 } } },
  ]);
  const byTenant = new Map<string, { mediaArrays: { url: string; type: string }[][]; postCount: number }>(
    grouped.map((g) => [g._id as string, g])
  );

  return Promise.all(
    tenants.map(async (t) => {
      const g = byTenant.get(t.id);
      const previews: string[] = [];
      if (g) {
        for (const media of g.mediaArrays) {
          for (const m of media) {
            if (m.type !== "image") continue;
            previews.push(await storageProvider.resolveUrl(m.url));
            if (previews.length >= 3) break;
          }
          if (previews.length >= 3) break;
        }
      }
      return { ...t, portfolioPreview: previews, portfolioCount: g?.postCount ?? 0 };
    })
  );
}

type TenantSort = "rating" | "price_asc" | "price_desc" | "name";
const TENANT_SORTS: readonly TenantSort[] = ["rating", "price_asc", "price_desc", "name"];

// Ranking default: a Bayesian-weighted rating (prior 4.0, confidence 10 reviews) so a salon with
// one 5-star review doesn't outrank one with hundreds averaging 4.7 — then falls back to review volume.
function tenantSortExpr(sort: TenantSort): Prisma.Sql {
  switch (sort) {
    case "price_asc":
      return Prisma.sql`(sv.minPrice IS NULL) ASC, sv.minPrice ASC`;
    case "price_desc":
      return Prisma.sql`(sv.minPrice IS NULL) ASC, sv.minPrice DESC`;
    case "name":
      return Prisma.sql`t.salonName ASC`;
    case "rating":
    default:
      return Prisma.sql`((COALESCE(rv.reviewCount, 0) * COALESCE(rv.avgRating, 0)) + 10 * 4.0) / (COALESCE(rv.reviewCount, 0) + 10) DESC, COALESCE(rv.reviewCount, 0) DESC, t.salonName ASC`;
  }
}

const updateTenantSchema = z.object({
  salonName: z.string().min(2).max(191).optional(),
  ownerName: z.string().min(2).max(191).optional(),
  address: z.string().max(2000).optional(),
  mapLink: z.string().max(500).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  contactPhone: z.string().max(50).optional(),
});

export async function listPublicTenants(req: Request, res: Response) {
  const { page, pageSize, skip, take } = parsePagination(req.query, 12, 50);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const location = typeof req.query.location === "string" ? req.query.location.trim() : "";
  const lat = req.query.lat !== undefined ? Number(req.query.lat) : NaN;
  const lng = req.query.lng !== undefined ? Number(req.query.lng) : NaN;
  const hasGeo = !Number.isNaN(lat) && !Number.isNaN(lng);
  const rawSort = typeof req.query.sort === "string" ? req.query.sort : "rating";
  const sort: TenantSort = TENANT_SORTS.includes(rawSort as TenantSort) ? (rawSort as TenantSort) : "rating";

  const searchClause = q
    ? Prisma.sql`AND (t.salonName LIKE ${`%${q}%`} OR EXISTS (SELECT 1 FROM services s WHERE s.tenantId = t.id AND s.name LIKE ${`%${q}%`}))`
    : Prisma.empty;
  const locationClause = !hasGeo && location ? Prisma.sql`AND t.address LIKE ${`%${location}%`}` : Prisma.empty;
  const geoClause = hasGeo ? Prisma.sql`AND t.latitude IS NOT NULL AND t.longitude IS NOT NULL` : Prisma.empty;
  const distanceExpr = hasGeo
    ? Prisma.sql`(6371 * ACOS(LEAST(1, GREATEST(-1,
        COS(RADIANS(${lat})) * COS(RADIANS(t.latitude)) * COS(RADIANS(t.longitude) - RADIANS(${lng})) +
        SIN(RADIANS(${lat})) * SIN(RADIANS(t.latitude))
      ))))`
    : Prisma.sql`NULL`;
  const orderExpr = hasGeo ? Prisma.sql`distance ASC` : tenantSortExpr(sort);

  const rows = await prisma.$queryRaw<
    Array<{ id: string; avgRating: number; reviewCount: bigint; minPrice: string | null; distance: number | null }>
  >(Prisma.sql`
    SELECT t.id,
      COALESCE(rv.avgRating, 0) AS avgRating,
      COALESCE(rv.reviewCount, 0) AS reviewCount,
      sv.minPrice AS minPrice,
      ${distanceExpr} AS distance
    FROM tenants t
    LEFT JOIN (SELECT tenantId, AVG(rating) AS avgRating, COUNT(*) AS reviewCount FROM reviews GROUP BY tenantId) rv ON rv.tenantId = t.id
    LEFT JOIN (SELECT tenantId, MIN(price) AS minPrice FROM services WHERE isActive = 1 GROUP BY tenantId) sv ON sv.tenantId = t.id
    WHERE t.isActive = 1 ${searchClause} ${locationClause} ${geoClause}
    ORDER BY ${orderExpr}
    LIMIT ${take} OFFSET ${skip}
  `);

  const [{ count }] = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
    SELECT COUNT(*) AS count FROM tenants t
    WHERE t.isActive = 1 ${searchClause} ${locationClause} ${geoClause}
  `);

  const ids = rows.map((r) => r.id);
  const tenantsById = new Map(
    (await prisma.tenant.findMany({ where: { id: { in: ids } }, select: TENANT_CARD_SELECT })).map((t) => [t.id, t])
  );
  const statsById = new Map(rows.map((r) => [r.id, r]));

  const ranked = ids
    .map((id) => {
      const t = tenantsById.get(id);
      const stats = statsById.get(id);
      if (!t || !stats) return null;
      return {
        ...t,
        avgRating: Number(stats.avgRating),
        reviewCount: Number(stats.reviewCount),
        startingPrice: stats.minPrice !== null ? Number(stats.minPrice) : null,
        distanceKm: stats.distance !== null ? Number(stats.distance) : undefined,
      };
    })
    .filter((t): t is NonNullable<typeof t> => !!t);

  const withPortfolios = await attachPortfolioPreviews(ranked);

  return res.json({
    success: true,
    tenants: await resolveTenantLogos(withPortfolios),
    sort: hasGeo ? "distance" : sort,
    ...paginationMeta(Number(count), page, pageSize),
  });
}

export async function getPublicTenantBySlug(req: Request, res: Response) {
  const { slug } = req.params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: {
      id: true,
      salonName: true,
      slug: true,
      subscription: true,
      isActive: true,
      logoUrl: true,
      address: true,
      mapLink: true,
      latitude: true,
      longitude: true,
      contactPhone: true,
      services: { where: { isActive: true } },
      staff: { where: { isActive: true }, select: { id: true, name: true, role: true } },
    },
  });
  if (!tenant || !tenant.isActive) throw new HttpError(404, "Salon not found");
  if (tenant.logoUrl) tenant.logoUrl = await storageProvider.resolveUrl(tenant.logoUrl);
  return res.json({ success: true, tenant });
}

export async function updateTenant(req: AuthRequest, res: Response) {
  const data = updateTenantSchema.parse(req.body);
  const tenant = await prisma.tenant.update({ where: { id: req.tenantId! }, data });
  if (tenant.logoUrl) tenant.logoUrl = await storageProvider.resolveUrl(tenant.logoUrl);
  return res.json({ success: true, tenant });
}

export async function uploadTenantLogo(req: AuthRequest, res: Response) {
  const file = req.file as Express.Multer.File | undefined;
  if (!file) throw new HttpError(400, "Logo image is required");

  const ext = file.mimetype.split("/")[1];
  const key = `tenants/${req.tenantId}/logo-${uuid()}.${ext}`;
  const logoUrl = await storageProvider.upload(key, file.buffer, file.mimetype);

  const tenant = await prisma.tenant.update({
    where: { id: req.tenantId! },
    data: { logoUrl },
  });
  tenant.logoUrl = await storageProvider.resolveUrl(tenant.logoUrl!);

  return res.json({ success: true, tenant });
}
