import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createStaff, deleteStaff, listStaff } from "@/api/staff";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { colors, fonts } from "@/lib/theme";

const AVATAR_TONES = ["#f0367e", "#d31e66", "#ad1454", "#1e40af", "#d97706"];

export default function StaffScreen() {
  const queryClient = useQueryClient();
  const { data: staff } = useQuery({ queryKey: ["staff"], queryFn: listStaff });

  const [name, setName] = useState("");
  const [role, setRole] = useState("Stylist");
  const [commission, setCommission] = useState("");

  const createMutation = useMutation({
    mutationFn: () => createStaff({ name: name.trim(), role: role.trim() || "Stylist", commission: Number(commission) || 0 }),
    onSuccess: () => {
      setName("");
      setRole("Stylist");
      setCommission("");
      queryClient.invalidateQueries({ queryKey: ["staff"] });
    },
    onError: (err: any) => Alert.alert("Couldn't add staff", err.response?.data?.error || "Try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStaff,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["staff"] }),
  });

  function confirmRemove(id: string, name: string) {
    Alert.alert("Remove staff member?", `"${name}" will no longer be assignable to bookings.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Add staff member</Text>
      <View style={styles.card}>
        <Input placeholder="Name" value={name} onChangeText={setName} />
        <View style={styles.row}>
          <Input placeholder="Role (e.g. Stylist)" value={role} onChangeText={setRole} style={styles.flexInput} />
          <Input placeholder="Commission %" keyboardType="numeric" value={commission} onChangeText={setCommission} style={styles.flexInput} />
        </View>
        <Button title="Add staff" onPress={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!name.trim()} />
      </View>

      <Text style={styles.sectionTitle}>Team</Text>
      <View style={styles.card}>
        {staff?.length ? (
          staff.map((s, i) => (
            <View key={s.id} style={styles.staffRow}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_TONES[i % AVATAR_TONES.length] }]}>
                <Text style={styles.avatarText}>{s.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>{s.name}</Text>
                <Text style={styles.staffMeta}>
                  {s.role} · {s.commission}% commission
                </Text>
              </View>
              <Pressable onPress={() => confirmRemove(s.id, s.name)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No staff added yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  sectionTitle: { fontSize: 13, fontFamily: fonts.sansBold, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  row: { flexDirection: "row", gap: 10 },
  flexInput: { flex: 1 },
  staffRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontFamily: fonts.sansBold, fontSize: 15 },
  staffInfo: { flex: 1 },
  staffName: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  staffMeta: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 2 },
  removeText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.danger },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, textAlign: "center", paddingVertical: 12 },
});
