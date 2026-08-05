import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Scissors, Baby, ShieldCheck, Clock3, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { useAppDispatch } from "@/hooks/redux";
import { setAuth } from "@/store/authSlice";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlamEdgeLogo } from "@/components/shared/GlamEdgeLogo";

type Step = "phone" | "otp" | "pending" | "blocked";

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [salonName, setSalonName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blockedMessage, setBlockedMessage] = useState("");
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
      if (res.data.pendingApproval) {
        setStep("pending");
        return;
      }
      dispatch(setAuth({ token: res.data.token, tenant: res.data.tenant }));
      toast(`Welcome, ${res.data.tenant.salonName}!`, "success");
      navigate("/dashboard");
    } catch (err: any) {
      const status = err.response?.status;
      const message = err.response?.data?.error || "Verification failed";
      if (message.includes("salonName")) {
        setNeedsRegistration(true);
        toast("New salon detected — tell us a bit about it", "default");
      } else if (status === 403) {
        setBlockedMessage(message);
        setStep("blocked");
      } else {
        toast(message, "error");
      }
    } finally {
      setLoading(false);
    }
  }

  function resetToPhone() {
    setStep("phone");
    setPhone("");
    setCode("");
    setNeedsRegistration(false);
    setBlockedMessage("");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero px-4 py-10">
      {/* decorative floating accents */}
      <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 animate-float-slow rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-64 w-64 animate-float-slow rounded-full bg-amber-400/20 blur-3xl [animation-delay:2s]" />
      <div className="pointer-events-none absolute right-1/4 top-1/3 h-32 w-32 animate-float-slow rounded-full bg-brand-300/20 blur-2xl [animation-delay:4s]" />

      <div className="relative z-10 grid w-full max-w-4xl gap-8 md:grid-cols-2 md:items-center">
        {/* left: brand story */}
        <div className="hidden flex-col gap-6 text-cream-50 md:flex">
          <div className="flex items-center gap-2">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow">
              <GlamEdgeLogo className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-2xl font-semibold">GlamEdge</span>
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight">
            Run your studio like a{" "}
            <span className="bg-gradient-to-r from-brand-300 to-amber-300 bg-clip-text text-transparent">
              five-star salon.
            </span>
          </h1>
          <p className="max-w-sm text-cream-100/70">
            Bookings, billing, and your portfolio feed — all in one glamorous, friction-free workspace.
          </p>
          <div className="flex flex-wrap gap-3 text-sm text-cream-100/80">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-brand-300" /> Ladies
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Scissors className="h-3.5 w-3.5 text-cream-100" /> Gents
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5">
              <Baby className="h-3.5 w-3.5 text-amber-300" /> Kids
            </span>
          </div>
        </div>

        {/* right: auth card */}
        <Card className="w-full border-white/40 bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-plum-800/90">
          <CardHeader className="items-center text-center">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-brand shadow-glow md:hidden">
              <GlamEdgeLogo className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-xl">GlamEdge Studio Engine</CardTitle>
            {(step === "phone" || step === "otp") && (
              <p className="text-sm text-plum-400 dark:text-cream-100/60">
                {step === "phone" ? "Enter your mobile number to continue" : "Enter the OTP we sent you"}
              </p>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {step === "pending" && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/10">
                  <Clock3 className="h-7 w-7 text-amber-500" />
                </div>
                <h3 className="font-display text-lg font-semibold text-plum-800 dark:text-cream-50">
                  Thanks for registering!
                </h3>
                <p className="text-sm text-plum-500 dark:text-cream-100/70">
                  Your salon is pending admin approval. We'll notify you as soon as it's reviewed — usually within
                  one business day.
                </p>
                <Button variant="ghost" size="sm" onClick={resetToPhone}>
                  Back to sign in
                </Button>
              </div>
            )}

            {step === "blocked" && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/10">
                  <AlertTriangle className="h-7 w-7 text-red-500" />
                </div>
                <h3 className="font-display text-lg font-semibold text-plum-800 dark:text-cream-50">
                  Access unavailable
                </h3>
                <p className="text-sm text-plum-500 dark:text-cream-100/70">{blockedMessage}</p>
                <Button variant="ghost" size="sm" onClick={resetToPhone}>
                  Back to sign in
                </Button>
              </div>
            )}

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

            {(step === "phone" || step === "otp") && (
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-plum-300 dark:text-cream-100/40">
                <ShieldCheck className="h-3.5 w-3.5" /> Secured by OTP — no passwords, ever.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
