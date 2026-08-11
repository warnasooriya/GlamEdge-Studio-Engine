import { StyleSheet, Text, View } from "react-native";
import { CategoryType } from "@/types";
import { fonts } from "@/lib/theme";

const CATEGORY_STYLE: Record<CategoryType, { bg: string; text: string; label: string }> = {
  LADIES: { bg: "#ffe0eb", text: "#ad1454", label: "Ladies" },
  GENTS: { bg: "#dbeafe", text: "#1e40af", label: "Gents" },
  KIDS: { bg: "#fef3c7", text: "#92400e", label: "Kids" },
};

export function CategoryBadge({ category }: { category: CategoryType }) {
  const style = CATEGORY_STYLE[category];
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  text: { fontSize: 11, fontFamily: fonts.sansBold },
});
