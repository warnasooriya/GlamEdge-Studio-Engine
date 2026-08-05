import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Paperclip, Send, FileText, X } from "lucide-react";
import { api } from "@/lib/api";
import { clientApi } from "@/lib/clientApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { AppointmentMessage } from "@/types";

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

interface MessagesResponse {
  messages: AppointmentMessage[];
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function BookingChatThread({ appointmentId, authType }: { appointmentId: string; authType: "owner" | "client" }) {
  const http = authType === "owner" ? api : clientApi;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data } = useQuery({
    queryKey: ["appointment-messages", appointmentId],
    queryFn: async () =>
      (await http.get<MessagesResponse>(`/api/appointments/${appointmentId}/messages`, { params: { pageSize: 100 } })).data,
    refetchInterval: 5000,
  });

  const messages = data?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      if (text.trim()) form.append("text", text.trim());
      if (file) form.append("attachment", file);
      return http.post(`/api/appointments/${appointmentId}/messages`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      setText("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["appointment-messages", appointmentId] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to send message", "error"),
  });

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    e.target.value = "";
    if (!selected) return;
    if (selected.size > MAX_ATTACHMENT_BYTES) {
      toast("Attachments must be 3MB or smaller", "error");
      return;
    }
    setFile(selected);
  }

  function handleSend() {
    if (!text.trim() && !file) return;
    send.mutate();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-lg border border-plum-100 bg-white/60 p-3 dark:border-white/10 dark:bg-white/5">
        {messages.length === 0 ? (
          <p className="py-4 text-center text-xs text-plum-300 dark:text-cream-100/40">
            No messages yet — send one to start the conversation.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m._id}
              className={cn("flex flex-col gap-0.5 rounded-lg px-3 py-2 text-sm", {
                "self-end bg-gradient-brand text-white": (m.senderType === "OWNER") === (authType === "owner"),
                "self-start bg-plum-100 text-plum-700 dark:bg-white/10 dark:text-cream-50":
                  (m.senderType === "OWNER") !== (authType === "owner"),
              })}
            >
              <span className="text-[10px] font-semibold opacity-70">{m.senderName}</span>
              {m.text && <span>{m.text}</span>}
              {m.attachment &&
                (m.attachment.mimeType.startsWith("image/") ? (
                  <a href={m.attachment.url} target="_blank" rel="noreferrer">
                    <img src={m.attachment.url} alt={m.attachment.filename} className="mt-1 max-h-40 rounded-md object-cover" />
                  </a>
                ) : (
                  <a
                    href={m.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 flex items-center gap-1.5 rounded-md bg-black/10 px-2 py-1 text-xs underline"
                  >
                    <FileText className="h-3.5 w-3.5" /> {m.attachment.filename} ({formatBytes(m.attachment.size)})
                  </a>
                ))}
              <span className="text-[10px] opacity-60">{new Date(m.createdAt).toLocaleString()}</span>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {file && (
        <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs text-plum-600 dark:bg-white/5 dark:text-cream-100/70">
          <Paperclip className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 truncate">
            {file.name} ({formatBytes(file.size)})
          </span>
          <button onClick={() => setFile(null)} className="shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileSelect} className="hidden" />
        <Button type="button" size="icon" variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Paperclip className="h-4 w-4" />
        </Button>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="h-10 flex-1 rounded-lg border border-plum-100 bg-white/90 px-3 text-sm dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-50"
        />
        <Button type="button" size="icon" onClick={handleSend} disabled={send.isPending || (!text.trim() && !file)}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
