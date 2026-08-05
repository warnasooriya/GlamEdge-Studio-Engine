import { Prisma } from "@prisma/client";

/**
 * A salon is publicly visible only while it is APPROVED, active, and its
 * subscription has not lapsed. Anything else — pending review, rejected,
 * suspended, or expired — is hidden from every public surface: the directory,
 * the salon page, and new bookings.
 *
 * A null subscriptionExpiresAt means "no expiry set" and does not hide the salon,
 * so a tenant is never dropped just because that field was never populated.
 */

export function publicTenantWhere(now: Date = new Date()): Prisma.TenantWhereInput {
  return {
    isActive: true,
    status: "APPROVED",
    OR: [{ subscriptionExpiresAt: null }, { subscriptionExpiresAt: { gt: now } }],
  };
}

/** Same rule as publicTenantWhere, for a tenant row already loaded. */
export function isPubliclyVisible(tenant: {
  isActive: boolean;
  status: string;
  subscriptionExpiresAt: Date | null;
}): boolean {
  if (!tenant.isActive || tenant.status !== "APPROVED") return false;
  if (tenant.subscriptionExpiresAt && tenant.subscriptionExpiresAt <= new Date()) return false;
  return true;
}

/** Same rule as a raw-SQL fragment, for the directory's hand-written query.
 *  Assumes the tenants table is aliased as `t`. */
export const publicTenantSql = Prisma.sql`
  AND t.isActive = 1
  AND t.status = 'APPROVED'
  AND (t.subscriptionExpiresAt IS NULL OR t.subscriptionExpiresAt > NOW())
`;
