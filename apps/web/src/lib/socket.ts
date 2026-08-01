import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function connectSocket(tenantId: string): Socket {
  if (socket) socket.disconnect();
  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:4000", {
    query: { tenantId },
  });
  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
