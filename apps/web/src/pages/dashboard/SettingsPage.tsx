import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Store, Upload, Clock, QrCode, Download, MessageCircle, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { useToast } from "@/components/ui/toast";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { updateTenant as setTenant } from "@/store/authSlice";
import { cn } from "@/lib/utils";
import { Tenant } from "@/types";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

export default function SettingsPage() {
  const tenant = useAppSelector((s) => s.auth.tenant);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [address, setAddress] = useState(tenant?.address || "");
  const [latitude, setLatitude] = useState<number | null>(tenant?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(tenant?.longitude ?? null);
  const [contactPhone, setContactPhone] = useState(tenant?.contactPhone || "");
  const [paypalEmail, setPaypalEmail] = useState(tenant?.paypalEmail || "");
  const [openTime, setOpenTime] = useState(tenant?.openTime || "09:00");
  const [closeTime, setCloseTime] = useState(tenant?.closeTime || "20:00");
  const [workingDays, setWorkingDays] = useState<number[]>(tenant?.workingDays?.length ? tenant.workingDays : [0, 1, 2, 3, 4, 5, 6]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logoUrl || null);

  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const publicProfileUrl = tenant?.slug ? `${window.location.origin}/salon/${tenant.slug}` : "";

  useEffect(() => {
    let objectUrl: string | null = null;
    setQrLoading(true);
    api
      .get<Blob>("/api/tenants/me/qrcode", { responseType: "blob" })
      .then((res) => {
        objectUrl = URL.createObjectURL(res.data);
        setQrCodeUrl(objectUrl);
      })
      .catch(() => setQrCodeUrl(null))
      .finally(() => setQrLoading(false));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, []);

  function handleDownloadQrCode() {
    if (!qrCodeUrl) return;
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${tenant?.slug || "salon"}-qr-code.png`;
    link.click();
  }

  const shareQrCodeViaWhatsApp = useMutation({
    mutationFn: async () => api.post("/api/tenants/me/qrcode/share-whatsapp"),
  });

  async function handleShareQrCodeViaWhatsApp() {
    try {
      await shareQrCodeViaWhatsApp.mutateAsync();
      toast("QR code sent to your WhatsApp", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to send QR code", "error");
    }
  }

  function toggleWorkingDay(day: number) {
    setWorkingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  const uploadLogo = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append("logo", logoFile!);
      return api.post<{ tenant: Tenant }>("/api/tenants/me/logo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
  });

  const updateProfile = useMutation({
    mutationFn: async () =>
      api.patch<{ tenant: Tenant }>("/api/tenants/me", {
        address,
        contactPhone,
        paypalEmail,
        openTime,
        closeTime,
        workingDays,
        ...(latitude !== null && longitude !== null ? { latitude, longitude } : {}),
      }),
  });

  const saving = uploadLogo.isPending || updateProfile.isPending;

  async function handleSave() {
    if (workingDays.length === 0) {
      toast("Select at least one working day", "error");
      return;
    }
    if (openTime >= closeTime) {
      toast("Opening time must be before closing time", "error");
      return;
    }
    if (paypalEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail)) {
      toast("Enter a valid PayPal email, or leave it blank", "error");
      return;
    }
    try {
      let latestTenant: Tenant | undefined;

      if (logoFile) {
        const res = await uploadLogo.mutateAsync();
        latestTenant = res.data.tenant;
      }

      const res = await updateProfile.mutateAsync();
      latestTenant = res.data.tenant;

      if (latestTenant) dispatch(setTenant(latestTenant));
      setLogoFile(null);
      toast("Salon profile updated", "success");
    } catch (err: any) {
      toast(err.response?.data?.error || "Failed to update profile", "error");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Salon Profile</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-brand shadow-glow">
              {logoPreview ? (
                <img src={logoPreview} alt="Salon logo" className="h-full w-full object-cover" />
              ) : (
                <Store className="h-7 w-7 text-white" />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Logo</label>
              <label className="flex w-fit cursor-pointer items-center gap-1.5 rounded-full border border-plum-100 bg-white/90 px-3 py-1.5 text-xs font-semibold text-plum-600 shadow-sm hover:bg-brand-50 dark:border-white/10 dark:bg-plum-700/60 dark:text-cream-100">
                <Upload className="h-3.5 w-3.5" /> Choose image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Address</label>
            <Textarea
              placeholder="123 Galle Road, Colombo 03"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Location</label>
            <LocationPicker
              apiKey={GOOGLE_MAPS_API_KEY}
              lat={latitude}
              lng={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Contact number</label>
            <Input
              placeholder="011 234 5678"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-brand-500" /> Payments
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">
              PayPal email for receiving payments
            </label>
            <Input
              type="email"
              placeholder="yoursalon@example.com"
              value={paypalEmail}
              onChange={(e) => setPaypalEmail(e.target.value)}
            />
            <p className="text-xs text-plum-400 dark:text-cream-100/60">
              Customers pay directly into this account when you send them a bill online — just your PayPal
              email, no approval process needed. Leave blank to disable online payments.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-4 w-4 text-brand-500" /> Share Profile QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-plum-400 dark:text-cream-100/60">
            Customers who scan this code land straight on your public profile at{" "}
            <span className="font-medium text-plum-600 dark:text-cream-100">{publicProfileUrl}</span>.
          </p>

          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="w-48 shrink-0 overflow-hidden rounded-2xl border border-plum-100 bg-white shadow-sm dark:border-white/10">
              {qrLoading ? (
                <div className="flex aspect-[5/7] items-center justify-center">
                  <span className="text-xs text-plum-400 dark:text-cream-100/50">Loading...</span>
                </div>
              ) : qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Salon profile QR code" className="w-full" />
              ) : (
                <div className="flex aspect-[5/7] items-center justify-center px-2 text-center text-xs text-plum-400 dark:text-cream-100/50">
                  Couldn't load QR code
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadQrCode}
                disabled={!qrCodeUrl}
                className="justify-start"
              >
                <Download className="h-3.5 w-3.5" /> Download image
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareQrCodeViaWhatsApp}
                disabled={shareQrCodeViaWhatsApp.isPending}
                className="justify-start"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {shareQrCodeViaWhatsApp.isPending ? "Sending..." : "Send to my WhatsApp"}
              </Button>
              <p className="max-w-56 text-xs text-plum-400 dark:text-cream-100/50">
                This branded card is ready to post on social media or print for your counter.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-brand-500" /> Working Hours
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-plum-400 dark:text-cream-100/60">
            Customers can only book appointments within these hours, on the days you're open.
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Opens at</label>
              <Input
                type="time"
                className="w-36"
                value={openTime}
                onChange={(e) => setOpenTime(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Closes at</label>
              <Input
                type="time"
                className="w-36"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Open on</label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleWorkingDay(d.value)}
                  className={cn(
                    "rounded-full border-2 px-3.5 py-1.5 text-xs font-medium transition-all",
                    workingDays.includes(d.value)
                      ? "border-transparent bg-gradient-brand text-white shadow-glow"
                      : "border-plum-100 text-plum-500 hover:border-brand-300 dark:border-white/10 dark:text-cream-100/70"
                  )}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="self-start">
        {saving ? "Saving..." : "Save Changes"}
      </Button>
    </div>
  );
}
