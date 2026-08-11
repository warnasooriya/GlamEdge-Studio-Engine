import { api } from "./client";

export async function registerPushToken(token: string, platform: "IOS" | "ANDROID") {
  await api.post("/api/owner/push-tokens", { token, platform });
}

export async function unregisterPushToken(token: string) {
  await api.delete("/api/owner/push-tokens", { data: { token } });
}
