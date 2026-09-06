import { api } from "./client";

export type ReportTargetType = "REVIEW" | "MESSAGE" | "FEED_POST";

export type ReportReason =
  | "SPAM"
  | "HARASSMENT"
  | "HATE_SPEECH"
  | "SEXUAL_CONTENT"
  | "VIOLENCE"
  | "IMPERSONATION"
  | "OTHER";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "SPAM", label: "Spam or advertising" },
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "HATE_SPEECH", label: "Hate speech" },
  { value: "SEXUAL_CONTENT", label: "Sexual or explicit content" },
  { value: "VIOLENCE", label: "Violence or threats" },
  { value: "IMPERSONATION", label: "Impersonation or scam" },
  { value: "OTHER", label: "Something else" },
];

export async function reportContent(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}) {
  const { data } = await api.post<{ success: boolean; alreadyReported?: boolean }>("/api/moderation/reports", input);
  return data;
}

export async function blockClient(clientId: string, reason?: string) {
  const { data } = await api.post<{ success: boolean }>("/api/moderation/blocks", { clientId, reason });
  return data;
}

export async function unblockClient(clientId: string) {
  const { data } = await api.delete<{ success: boolean }>(`/api/moderation/blocks/${clientId}`);
  return data;
}

export interface BlockedClientRow {
  id: string;
  clientId: string;
  reason?: string | null;
  createdAt: string;
  client: { id: string; name: string; phone: string };
}

export async function listBlockedClients() {
  const { data } = await api.get<{ success: boolean; blocks: BlockedClientRow[] }>("/api/moderation/blocks");
  return data.blocks;
}
