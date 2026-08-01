import http from "http";
import { app } from "./app";
import { env } from "@/config/env";
import { connectMongo } from "@/config/mongo";
import { initRealtime } from "@/realtime/socket";

async function main() {
  await connectMongo();

  const server = http.createServer(app);
  initRealtime(server);

  server.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error("Failed to start API server:", err);
  process.exit(1);
});
