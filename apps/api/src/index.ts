import http from "http";
import { app } from "./app";
import { env } from "@/config/env";
import { connectMongo } from "@/config/mongo";
import { initRealtime } from "@/realtime/socket";
import { bootstrapFirstAdmin } from "@/services/adminBootstrap";
import { checkExpiringSubscriptions } from "@/services/subscriptionExpiryChecker";

const EXPIRY_CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

async function main() {
  await connectMongo();
  await bootstrapFirstAdmin();

  const server = http.createServer(app);
  initRealtime(server);

  server.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
  });

  checkExpiringSubscriptions().catch((err) => console.error("Subscription expiry check failed:", err));
  setInterval(() => {
    checkExpiringSubscriptions().catch((err) => console.error("Subscription expiry check failed:", err));
  }, EXPIRY_CHECK_INTERVAL_MS);
}

main().catch((err) => {
  console.error("Failed to start API server:", err);
  process.exit(1);
});
