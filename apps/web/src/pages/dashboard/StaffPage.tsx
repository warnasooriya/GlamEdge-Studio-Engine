import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { Staff } from "@/types";

const AVATAR_TONES = [
  "bg-gradient-to-br from-brand-400 to-brand-600",
  "bg-gradient-to-br from-amber-400 to-amber-600",
  "bg-gradient-to-br from-plum-400 to-plum-600",
  "bg-gradient-to-br from-emerald-400 to-emerald-600",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function StaffPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["staff"],
    queryFn: async () => (await api.get<{ staff: Staff[] }>("/api/staff")).data,
  });

  const [name, setName] = useState("");
  const [role, setRole] = useState("Stylist");
  const [commission, setCommission] = useState("10");

  const createStaff = useMutation({
    mutationFn: async () => api.post("/api/staff", { name, role, commission: Number(commission) }),
    onSuccess: () => {
      toast("Staff member added", "success");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => toast(err.response?.data?.error || "Failed to add staff", "error"),
  });

  const deleteStaff = useMutation({
    mutationFn: async (id: string) => api.delete(`/api/staff/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Add Staff Member</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Role" value={role} onChange={(e) => setRole(e.target.value)} />
          <Input
            placeholder="Commission %"
            type="number"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
          />
          <Button disabled={!name || createStaff.isPending} onClick={() => createStaff.mutate()}>
            Add
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Team</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col divide-y divide-plum-100 dark:divide-white/10">
          {data?.staff?.length ? (
            data.staff.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm",
                      AVATAR_TONES[i % AVATAR_TONES.length]
                    )}
                  >
                    {initials(s.name)}
                  </div>
                  <div>
                    <p className="font-medium text-plum-700 dark:text-cream-50">{s.name}</p>
                    <p className="text-xs text-plum-400 dark:text-cream-100/50">
                      {s.role} • {s.commission}% commission
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => deleteStaff.mutate(s.id)}>
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-sm text-plum-300 dark:text-cream-100/40">No staff yet — add one above.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
