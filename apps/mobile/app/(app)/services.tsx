import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createService, deleteService, listServices } from "@/api/services";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { CategoryBadge } from "@/components/CategoryBadge";
import { colors, fonts } from "@/lib/theme";
import { formatCurrency } from "@/lib/format";
import { CategoryType } from "@/types";

const CATEGORIES: CategoryType[] = ["LADIES", "GENTS", "KIDS"];

export default function ServicesScreen() {
  const queryClient = useQueryClient();
  const { data: services } = useQuery({ queryKey: ["services"], queryFn: listServices });

  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMin, setDurationMin] = useState("30");

  const createMutation = useMutation({
    mutationFn: () => createService({ category, name: name.trim(), price: Number(price), durationMin: Number(durationMin) || 30 }),
    onSuccess: () => {
      setName("");
      setPrice("");
      setDurationMin("30");
      queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (err: any) => Alert.alert("Couldn't add service", err.response?.data?.error || "Try again."),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["services"] }),
  });

  function confirmRemove(id: string, name: string) {
    Alert.alert("Remove service?", `"${name}" will no longer be bookable.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => deleteMutation.mutate(id) },
    ]);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Add service</Text>
      <View style={styles.card}>
        <View style={styles.chipRow}>
          {CATEGORIES.map((c) => (
            <Pressable key={c} onPress={() => setCategory(c)} style={category === c && styles.chipSelected}>
              <CategoryBadge category={c} />
            </Pressable>
          ))}
        </View>
        <Input placeholder="Service name" value={name} onChangeText={setName} />
        <View style={styles.row}>
          <Input placeholder="Price (Rs.)" keyboardType="numeric" value={price} onChangeText={setPrice} style={styles.flexInput} />
          <Input placeholder="Duration (min)" keyboardType="numeric" value={durationMin} onChangeText={setDurationMin} style={styles.flexInput} />
        </View>
        <Button
          title="Add service"
          onPress={() => createMutation.mutate()}
          loading={createMutation.isPending}
          disabled={!name.trim() || !price}
        />
      </View>

      <Text style={styles.sectionTitle}>Service menu</Text>
      <View style={styles.card}>
        {services?.length ? (
          services.map((s) => (
            <View key={s.id} style={styles.serviceRow}>
              <View style={styles.serviceInfo}>
                <View style={styles.serviceNameRow}>
                  <Text style={styles.serviceName}>{s.name}</Text>
                  <CategoryBadge category={s.category} />
                </View>
                <Text style={styles.serviceMeta}>
                  {formatCurrency(s.price)} · {s.durationMin} min
                </Text>
              </View>
              <Pressable onPress={() => confirmRemove(s.id, s.name)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No services yet.</Text>
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
  chipRow: { flexDirection: "row", gap: 8 },
  chipSelected: { transform: [{ scale: 1.05 }] },
  row: { flexDirection: "row", gap: 10 },
  flexInput: { flex: 1 },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  serviceInfo: { flex: 1, marginRight: 8 },
  serviceNameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  serviceName: { fontSize: 14, fontFamily: fonts.sansBold, color: colors.text },
  serviceMeta: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 2 },
  removeText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.danger },
  emptyText: { color: colors.textMuted, fontFamily: fonts.sans, fontSize: 13, textAlign: "center", paddingVertical: 12 },
});
