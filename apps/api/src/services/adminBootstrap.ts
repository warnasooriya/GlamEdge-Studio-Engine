import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/config/prisma";
import { env } from "@/config/env";

// Dev convenience, mirrors the OTP console-stub pattern: if no admin account exists
// yet, create the first one from env vars (or a generated password logged once here)
// so there's a way into the admin portal without a separate seed step.
export async function bootstrapFirstAdmin() {
  const existing = await prisma.admin.count();
  if (existing > 0) return;

  const password = env.adminBootstrap.password || crypto.randomBytes(9).toString("base64url");
  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.create({
    data: {
      email: env.adminBootstrap.email,
      passwordHash,
      name: "Platform Admin",
    },
  });

  console.log("=".repeat(60));
  console.log("[admin] First admin account created:");
  console.log(`[admin]   email:    ${env.adminBootstrap.email}`);
  console.log(`[admin]   password: ${password}`);
  console.log("[admin] Set ADMIN_EMAIL / ADMIN_PASSWORD to control this next time.");
  console.log("=".repeat(60));
}
