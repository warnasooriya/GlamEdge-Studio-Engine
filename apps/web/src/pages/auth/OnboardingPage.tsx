import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { useAppDispatch } from "@/hooks/redux";
import { setAuth } from "@/store/authSlice";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Step = "phone" | "otp";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [salonName, setSalonName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  async function requestOtp() {
    if (!phone) return;
    setLoading(true);
    try {
      await api.post("/api/auth/otp/request", { phone });
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
      const res = await api.post("/api/auth/otp/verify", {
        phone,
        code,
        ...(needsRegistration ? { salonName, ownerName } : {}),
      });
      dispatch(setAuth({ token: res.data.token, tenant: res.data.tenant }));
      toast(`Welcome, ${res.data.tenant.salonName}!`, "success");
      navigate("/dashboard");
    } catch (err: any) {
      const message = err.response?.data?.error || "Verification failed";
      if (message.includes("salonName")) {
        setNeedsRegistration(true);
        toast("New salon detected — tell us a bit about it", "default");
      } else {
        toast(message, "error");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-navy via-slate-900 to-brand-pink/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-xl">GlamEdge Studio Engine</CardTitle>
          <p className="text-center text-sm text-slate-500">
            {step === "phone" ? "Enter your mobile number to continue" : "Enter the OTP we sent you"}
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {step === "phone" && (
            <>
              <Input
                placeholder="07XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <Button onClick={requestOtp} disabled={loading || !phone}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </>
          )}

          {step === "otp" && (
            <>
              <Input
                placeholder="6-digit code"
                value={code}
                maxLength={6}
                onChange={(e) => setCode(e.target.value)}
              />
              {needsRegistration && (
                <>
                  <Input
                    placeholder="Salon name"
                    value={salonName}
                    onChange={(e) => setSalonName(e.target.value)}
                  />
                  <Input
                    placeholder="Owner name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                  />
                </>
              )}
              <Button onClick={verifyOtp} disabled={loading || !code}>
                {loading ? "Verifying..." : "Verify & Continue"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setStep("phone")}>
                Change number
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
