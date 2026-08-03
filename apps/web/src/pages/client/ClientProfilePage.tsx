import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { clientApi } from "@/lib/clientApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setClientAuth } from "@/store/clientAuthSlice";
import { Client } from "@/types";

export default function ClientProfilePage() {
  const token = useAppSelector((s) => s.clientAuth.token);
  const client = useAppSelector((s) => s.clientAuth.client);
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const [name, setName] = useState(client?.name || "");

  const updateProfile = useMutation({
    mutationFn: async () => clientApi.patch<{ client: Client }>("/api/client-auth/me", { name }),
    onSuccess: (res) => {
      if (token) dispatch(setClientAuth({ token, client: res.data.client }));
      toast("Profile updated", "success");
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to update profile", "error"),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-plum-400 dark:text-cream-100/50">Phone number</label>
          <Input value={client?.phone || ""} disabled />
          <p className="text-xs text-plum-300 dark:text-cream-100/40">
            Your phone number is your login — it can't be changed here.
          </p>
        </div>

        <Button
          onClick={() => updateProfile.mutate()}
          disabled={updateProfile.isPending || !name}
          className="self-start"
        >
          {updateProfile.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
