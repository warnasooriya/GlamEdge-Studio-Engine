import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "@/config/env";

let io: SocketIOServer | null = null;

export function initRealtime(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: { origin: env.corsOrigin, credentials: true },
  });

  io.on("connection", (socket) => {
    const tenantId = socket.handshake.query.tenantId as string | undefined;
    if (tenantId) {
      socket.join(tenantRoom(tenantId));
    }

    socket.on("disconnect", () => {
      // no-op: socket.io cleans up room membership automatically
    });
  });

  return io;
}

export function tenantRoom(tenantId: string): string {
  return `tenant:${tenantId}`;
}

export function emitToTenant(tenantId: string, event: string, payload: unknown): void {
  io?.to(tenantRoom(tenantId)).emit(event, payload);
}
