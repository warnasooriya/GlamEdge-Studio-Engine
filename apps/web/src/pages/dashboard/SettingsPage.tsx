import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Store, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { useToast } from "@/components/ui/toast";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { updateTenant as setTenant } from "@/store/authSlice";
import { Tenant } from "@/types";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

export default function SettingsPage() {
  const tenant = useAppSelector((s) => s.auth.tenant);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [address, setAddress] = useState(tenant?.address || "");
  const [latitude, setLatitude] = useState<number | null>(tenant?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(tenant?.longitude ?? null);
  const [contactPhone, setContactPhone] = useState(tenant?.contactPhone || "");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(tenant?.logoUrl || null);

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
        ...(latitude !== null && longitude !== null ? { latitude, longitude } : {}),
      }),
  });

  const saving = uploadLogo.isPending || updateProfile.isPending;

  async function handleSave() {
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

          <Button onClick={handleSave} disabled={saving} className="self-start">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
