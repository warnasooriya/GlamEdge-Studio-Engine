import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { useAppDispatch } from "@/hooks/redux";
import { setAdminAuth } from "@/store/adminAuthSlice";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GlamEdgeLogo } from "@/components/shared/GlamEdgeLogo";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  async function handleLogin() {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await adminApi.post("/api/admin/login", { email, password });
      dispatch(setAdminAuth({ token: res.data.token, admin: res.data.admin }));
      toast(`Welcome back, ${res.data.admin.name}`, "success");
      navigate("/admin");
    } catch (err: any) {
      toast(err.response?.data?.error || "Login failed", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-hero px-4 py-10">
      <div className="pointer-events-none absolute -left-16 top-16 h-56 w-56 animate-float-slow rounded-full bg-plum-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-10 h-64 w-64 animate-float-slow rounded-full bg-brand-400/20 blur-3xl [animation-delay:2s]" />

      <Card className="relative z-10 w-full max-w-sm border-white/40 bg-white/90 shadow-2xl backdrop-blur-xl dark:bg-plum-800/90">
        <CardHeader className="items-center text-center">
          <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-plum-700 shadow-glow">
            <GlamEdgeLogo className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Administrator Portal</CardTitle>
          <p className="text-sm text-plum-400 dark:text-cream-100/60">Sign in with your admin credentials</p>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />
          <Button variant="plum" onClick={handleLogin} disabled={loading || !email || !password}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-plum-300 dark:text-cream-100/40">
            <ShieldCheck className="h-3.5 w-3.5" /> Restricted access — platform staff only.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
