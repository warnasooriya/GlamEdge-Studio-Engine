import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { requestOtp } from "@/api/auth";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { colors, fonts } from "@/lib/theme";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    if (!phone.trim()) {
      setError("Enter your phone number");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await requestOtp(phone.trim());
      router.push({ pathname: "/(auth)/otp", params: { phone: phone.trim() } });
    } catch (err: any) {
      setError(err.response?.data?.error || "Couldn't send the code. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in with your salon's phone number to manage bookings on the go.</Text>
        <Input
          label="Phone number"
          placeholder="07XXXXXXXX"
          keyboardType="phone-pad"
          autoFocus
          value={phone}
          onChangeText={setPhone}
          error={error}
        />
        <Button title="Send code" onPress={handleContinue} loading={loading} style={styles.button} />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  content: {},
  title: { fontSize: 26, fontFamily: fonts.displayBold, color: colors.text, marginBottom: 8 },
  subtitle: { fontSize: 15, fontFamily: fonts.sans, color: colors.textMuted, marginBottom: 28, lineHeight: 21 },
  button: { marginTop: 4 },
});
