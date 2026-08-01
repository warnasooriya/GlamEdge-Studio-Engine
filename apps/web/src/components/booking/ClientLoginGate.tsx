import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { clientApi } from "@/lib/clientApi";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setClientAuth } from "@/store/clientAuthSlice";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Step = "phone" | "otp";

export function ClientLoginGate({ children }: { children: React.ReactNode }) {
  const token = useAppSelector((s) => s.clientAuth.token);
  const client = useAppSelector((s) => s.clientAuth.client);
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  if (token && client) return <>{children}</>;

  async function requestOtp() {
    if (!phone) return;
    setLoading(true);
    try {
      await clientApi.post("/api/client-auth/otp/request", { phone });
      toast("OTP sent — check the API server console (dev mode)", "success");
      setStep("otp");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to send OTP", "error");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    if (!code) return;
    setLoading(true);
    try {
      const res = await clientApi.post("/api/client-auth/otp/verify", {
        phone,
        code,
        ...(needsRegistration ? { name } : {}),
      });
      dispatch(setClientAuth({ token: res.data.token, client: res.data.client }));
      toast(`Welcome, ${res.data.client.name}!`, "success");
    } catch (err: any) {
      const message = err.response?.data?.error || "Verification failed";
      if (message.includes("name")) {
        setNeedsRegistration(true);
        toast("New number detected — tell us your name", "default");
      } else {
        toast(message, "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-panel flex flex-col items-center gap-3 p-6 text-center">
      <p className="text-sm font-semibold text-plum-700 dark:text-cream-50">
        {step === "phone" ? "Log in to book an appointment" : "Enter the OTP we sent you"}
      </p>

      {step === "phone" && (
        <div className="flex w-full flex-col gap-2">
          <Input placeholder="07XXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Button onClick={requestOtp} disabled={loading || !phone}>
            {loading ? "Sending..." : "Send OTP"}
          </Button>
        </div>
      )}

      {step === "otp" && (
        <div className="flex w-full flex-col gap-2">
          <Input placeholder="6-digit code" value={code} maxLength={6} onChange={(e) => setCode(e.target.value)} />
          {needsRegistration && (
            <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
          )}
          <Button onClick={verifyOtp} disabled={loading || !code}>
            {loading ? "Verifying..." : "Verify & Continue"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setStep("phone")}>
            Change number
          </Button>
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-xs text-plum-300 dark:text-cream-100/40">
        <ShieldCheck className="h-3.5 w-3.5" /> Secured by OTP — no passwords, ever.
      </p>
    </div>
  );
}
