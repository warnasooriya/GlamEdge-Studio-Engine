import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fonts } from "@/lib/theme";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <View style={styles.row}>
      <Pressable
        style={[styles.btn, page <= 1 && styles.btnDisabled]}
        onPress={() => page > 1 && onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <Ionicons name="chevron-back" size={16} color={page <= 1 ? colors.textMuted : colors.primary} />
      </Pressable>
      <Text style={styles.text}>
        Page {page} of {totalPages}
      </Text>
      <Pressable
        style={[styles.btn, page >= totalPages && styles.btnDisabled]}
        onPress={() => page < totalPages && onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        <Ionicons name="chevron-forward" size={16} color={page >= totalPages ? colors.textMuted : colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, paddingVertical: 12 },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  btnDisabled: { backgroundColor: colors.border, opacity: 0.6 },
  text: { fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.textMuted },
});
