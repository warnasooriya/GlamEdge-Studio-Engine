import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { colors, fonts } from "@/lib/theme";

export default function PendingApprovalScreen() {
  const { message } = useLocalSearchParams<{ message?: string }>();

  return (
    <AuthShell>
      <View style={styles.content}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.title}>Pending approval</Text>
        <Text style={styles.subtitle}>
          {message || "Your salon registration is pending admin approval. We'll notify you once it's reviewed."}
        </Text>
        <Button title="Back to sign in" variant="secondary" onPress={() => router.replace("/(auth)/phone")} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  content: { alignItems: "center", paddingTop: 24 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontFamily: fonts.displayBold, color: colors.text, marginBottom: 12 },
  subtitle: {
    fontSize: 15,
    fontFamily: fonts.sans,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 28,
  },
});
