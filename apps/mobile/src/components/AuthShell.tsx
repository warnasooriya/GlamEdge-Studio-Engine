import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { LogoBadge } from "./Logo";
import { colors, fonts, gradients } from "@/lib/theme";

interface AuthShellProps {
  children: React.ReactNode;
}

// Shared hero/card composition for the auth stack (phone, OTP, pending-approval) —
// mirrors the dark gradient-hero chrome + frosted glass language used across the
// web dashboard, so first launch reads as the same premium product.
export function AuthShell({ children }: AuthShellProps) {
  return (
    <LinearGradient colors={gradients.hero} style={styles.hero} start={{ x: 0.1, y: 0.1 }} end={{ x: 0.9, y: 0.9 }}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.brandRow}>
          <LogoBadge size={52} iconSize={26} />
          <View style={styles.wordmarkWrap}>
            <Text style={styles.wordmark}>GlamEdge</Text>
            <Text style={styles.wordmarkSub}>OWNER STUDIO</Text>
          </View>
        </View>
        <ScrollView
          style={styles.card}
          contentContainerStyle={styles.cardContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1 },
  flex: { flex: 1 },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingTop: 72,
    paddingBottom: 32,
    paddingHorizontal: 28,
  },
  wordmarkWrap: { gap: 2 },
  wordmark: { fontSize: 24, color: "#fff", fontFamily: fonts.displayBold },
  wordmarkSub: { fontSize: 11, letterSpacing: 2, color: "rgba(255,255,255,0.65)", fontFamily: fonts.sansSemiBold },
  card: {
    flex: 1,
    backgroundColor: colors.bg,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  cardContent: { padding: 28, paddingTop: 36, paddingBottom: 48, flexGrow: 1 },
});
