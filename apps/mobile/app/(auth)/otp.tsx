import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { verifyOtp } from "@/api/auth";
import { useAppDispatch } from "@/hooks/redux";
import { setAuth } from "@/store/authSlice";
import { registerForPushNotifications } from "@/lib/push";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { colors, fonts } from "@/lib/theme";

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const dispatch = useAppDispatch();

  const [code, setCode] = useState("");
  const [salonName, setSalonName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    if (!code.trim()) {
      setError("Enter the 6-digit code");
      return;
    }
    if (needsRegistration && (!salonName.trim() || !ownerName.trim())) {
      setError("Salon name and your name are required");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await verifyOtp({
        phone,
        code: code.trim(),
        salonName: needsRegistration ? salonName.trim() : undefined,
        ownerName: needsRegistration ? ownerName.trim() : undefined,
      });

      if (result.pendingApproval) {
        router.replace({ pathname: "/(auth)/pending-approval", params: { message: result.message ?? "" } });
        return;
      }
      if (result.token && result.tenant) {
        dispatch(setAuth({ token: result.token, tenant: result.tenant }));
        registerForPushNotifications().catch(() => {});
        router.replace("/(app)");
      }
    } catch (err: any) {
      const message: string | undefined = err.response?.data?.error;
      if (message?.includes("salonName")) {
        setNeedsRegistration(true);
        setError("Looks like this is a new salon — tell us a bit more to get started.");
      } else {
        setError(message || "Invalid or expired code. Try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <View>
        <Text style={styles.title}>Enter the code</Text>
        <Text style={styles.subtitle}>We sent a 6-digit code to {phone}.</Text>
        <Input
          label="Verification code"
          placeholder="123456"
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          value={code}
          onChangeText={setCode}
        />
        {needsRegistration ? (
          <>
            <Input label="Salon name" placeholder="e.g. Glow Studio" value={salonName} onChangeText={setSalonName} />
            <Input label="Your name" placeholder="Owner's full name" value={ownerName} onChangeText={setOwnerName} />
          </>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button
          title={needsRegistration ? "Create salon account" : "Verify"}
          onPress={handleVerify}
          loading={loading}
          style={styles.button}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontFamily: fonts.displayBold, color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: fonts.sans, color: colors.textMuted, marginBottom: 28, lineHeight: 21 },
  errorText: { color: colors.danger, fontSize: 13, marginBottom: 14, fontFamily: fonts.sans },
  button: { marginTop: 4 },
});
