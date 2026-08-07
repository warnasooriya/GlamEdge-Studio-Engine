import { useQuery } from "@tanstack/react-query";
import { MessageCircle, CheckCircle2, AlertTriangle, QrCode, Loader2, PowerOff } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WhatsAppStatus {
  configured: boolean;
  state: "unconfigured" | "starting" | "qr" | "authenticated" | "ready" | "disconnected" | "unreachable";
  hasQr: boolean;
}

const STATE_COPY: Record<WhatsAppStatus["state"], { label: string; tone: string; icon: typeof CheckCircle2 }> = {
  ready: { label: "Connected — bills send via WhatsApp Web", tone: "text-emerald-600", icon: CheckCircle2 },
  qr: { label: "Waiting for QR scan", tone: "text-amber-600", icon: QrCode },
  authenticated: { label: "Signed in, starting session…", tone: "text-amber-600", icon: Loader2 },
  starting: { label: "Starting…", tone: "text-plum-400", icon: Loader2 },
  disconnected: { label: "Disconnected — reconnecting automatically", tone: "text-red-500", icon: AlertTriangle },
  unreachable: { label: "Service unreachable — bills fall back to the Cloud API", tone: "text-red-500", icon: PowerOff },
  unconfigured: { label: "Not set up — bills use the Cloud API only", tone: "text-plum-400", icon: PowerOff },
};

export default function AdminWhatsAppPage() {
  const { data: status } = useQuery({
    queryKey: ["admin-whatsapp-status"],
    queryFn: async () => (await adminApi.get<WhatsAppStatus>("/api/admin/whatsapp/status")).data,
    refetchInterval: 3000,
  });

  const { data: qr } = useQuery({
    queryKey: ["admin-whatsapp-qr"],
    queryFn: async () => {
      try {
        return (await adminApi.get<{ qrDataUrl: string }>("/api/admin/whatsapp/qr")).data.qrDataUrl;
      } catch {
        return null;
      }
    },
    enabled: status?.state === "qr",
    refetchInterval: status?.state === "qr" ? 3000 : false,
  });

  const copy = status ? STATE_COPY[status.state] : null;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-brand-500" /> WhatsApp Web
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-plum-500 dark:text-cream-100/60">
            Bills and booking updates send from the salon's own WhatsApp number, scanned in below — no Meta business
            verification needed. If this session is down, sends fall back to the Cloud API automatically.
          </p>

          {copy && (
            <div className={cn("flex items-center gap-2 text-sm font-medium", copy.tone)}>
              <copy.icon className={cn("h-4 w-4", copy.icon === Loader2 && "animate-spin")} />
              {copy.label}
            </div>
          )}

          {status?.state === "qr" && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-plum-100 bg-white/60 p-6 dark:border-white/10 dark:bg-plum-800/40">
              {qr ? (
                <img src={qr} alt="WhatsApp login QR code" className="h-56 w-56 rounded-lg bg-white p-2" />
              ) : (
                <div className="flex h-56 w-56 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-plum-300" />
                </div>
              )}
              <p className="max-w-xs text-center text-xs text-plum-400 dark:text-cream-100/50">
                On the salon's phone: WhatsApp → Settings → Linked Devices → Link a Device, then scan this code. It
                refreshes automatically if it expires before you scan it.
              </p>
            </div>
          )}

          {status?.state === "unconfigured" && (
            <p className="rounded-lg bg-brand-50 p-3 text-xs text-plum-500 dark:bg-white/5 dark:text-cream-100/60">
              Set <code className="font-mono">WHATSAPP_WEB_INTERNAL_SECRET</code> in the server's .env and redeploy to
              enable this.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
