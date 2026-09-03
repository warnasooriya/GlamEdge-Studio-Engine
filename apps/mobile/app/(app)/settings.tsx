import { useState } from "react";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "@tanstack/react-query";
import { updateTenant, uploadTenantLogo } from "@/api/tenant";
import { deleteAccount } from "@/api/auth";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { updateTenant as updateTenantAction } from "@/store/authSlice";
import { useLogout } from "@/hooks/useLogout";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { LocationPicker } from "@/components/LocationPicker";
import { BottomTabBar } from "@/components/BottomTabBar";
import { colors, fonts } from "@/lib/theme";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const tenant = useAppSelector((s) => s.auth.tenant);
  const token = useAppSelector((s) => s.auth.token);
  const handleLogout = useLogout();

  // App Store Guideline 5.1.1(v) requires in-app account deletion. Two taps deep
  // and spelled out, because it is irreversible from the owner's side.
  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      Alert.alert("Account deleted", "Your salon account has been deleted.");
      handleLogout();
    },
    onError: (err: any) =>
      Alert.alert("Couldn't delete account", err?.response?.data?.error ?? "Something went wrong. Please try again."),
  });

  function confirmDelete() {
    Alert.alert(
      "Delete account?",
      "This permanently closes your GlamEdge salon account. Your bookings, services, staff, and customer history will no longer be accessible, and you'll be signed out on every device. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () =>
            Alert.alert("Are you sure?", "Tap Delete again to permanently close your account.", [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => deleteMutation.mutate() },
            ]),
        },
      ]
    );
  }

  const [salonName, setSalonName] = useState(tenant?.salonName ?? "");
  const [ownerName, setOwnerName] = useState(tenant?.ownerName ?? "");
  const [address, setAddress] = useState(tenant?.address ?? "");
  const [latitude, setLatitude] = useState<number | null>(tenant?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(tenant?.longitude ?? null);
  const [contactPhone, setContactPhone] = useState(tenant?.contactPhone ?? "");
  const [paypalEmail, setPaypalEmail] = useState(tenant?.paypalEmail ?? "");
  const [openTime, setOpenTime] = useState(tenant?.openTime ?? "09:00");
  const [closeTime, setCloseTime] = useState(tenant?.closeTime ?? "20:00");
  const [workingDays, setWorkingDays] = useState<number[]>(tenant?.workingDays ?? [0, 1, 2, 3, 4, 5, 6]);
  const [sharingQr, setSharingQr] = useState(false);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateTenant({
        salonName,
        ownerName,
        address,
        contactPhone,
        paypalEmail,
        openTime,
        closeTime,
        workingDays,
        ...(latitude !== null && longitude !== null ? { latitude, longitude } : {}),
      }),
    onSuccess: (updated) => {
      dispatch(updateTenantAction(updated));
      Alert.alert("Saved", "Your salon profile has been updated.");
    },
    onError: (err: any) => Alert.alert("Couldn't save", err.response?.data?.error || "Try again."),
  });

  const logoMutation = useMutation({
    mutationFn: uploadTenantLogo,
    onSuccess: (updated) => dispatch(updateTenantAction(updated)),
    onError: () => Alert.alert("Couldn't upload logo", "Try again."),
  });

  async function pickLogo() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsEditing: true });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    logoMutation.mutate({ uri: asset.uri, name: asset.fileName || "logo.jpg", type: asset.mimeType || "image/jpeg" });
  }

  function toggleDay(day: number) {
    setWorkingDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  const apiBaseUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000";
  const qrUrl = `${apiBaseUrl}/api/tenants/me/qrcode`;

  async function handleShareQrCode() {
    if (!token) return;
    setSharingQr(true);
    try {
      const fileUri = `${FileSystem.cacheDirectory}${tenant?.slug || "salon"}-qr-code.png`;
      const { uri } = await FileSystem.downloadAsync(qrUrl, fileUri, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert("Sharing isn't available", "Your device doesn't support the share sheet.");
        return;
      }
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Share station QR code" });
    } catch {
      Alert.alert("Couldn't share QR code", "Try again.");
    } finally {
      setSharingQr(false);
    }
  }

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.logoWrapper}>
            <Pressable style={styles.logoPicker} onPress={pickLogo}>
              {tenant?.logoUrl ? (
                <Image source={{ uri: tenant.logoUrl }} style={styles.logo} />
              ) : (
                <Ionicons name="storefront-outline" size={38} color="#fff" />
              )}
              {logoMutation.isPending ? (
                <View style={styles.logoOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              ) : null}
            </Pressable>
            <Pressable style={styles.editBadge} onPress={pickLogo} hitSlop={8}>
              <Ionicons name="camera" size={14} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.heroName}>{tenant?.salonName || "Your salon"}</Text>
          <Text style={styles.heroSubtitle}>{tenant?.ownerName ? `Owned by ${tenant.ownerName}` : "GlamEdge Owner"}</Text>
        </View>

        <Text style={styles.sectionTitle}>Profile</Text>
        <Input label="Name" value={salonName} onChangeText={setSalonName} />
        <Input label="Owner name" value={ownerName} onChangeText={setOwnerName} />
        <Input label="Address" value={address} onChangeText={setAddress} multiline />

        <Text style={styles.fieldLabel}>Location</Text>
        <LocationPicker
          lat={latitude}
          lng={longitude}
          onChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />

        <View style={{ height: 14 }} />
        <Input label="Contact phone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
        <Input label="PayPal email" value={paypalEmail} onChangeText={setPaypalEmail} keyboardType="email-address" autoCapitalize="none" />

        <Text style={styles.sectionTitle}>Station QR Code</Text>
        <View style={styles.qrCard}>
          {token ? (
            <Image
              source={{ uri: qrUrl, headers: { Authorization: `Bearer ${token}` } }}
              style={styles.qr}
              resizeMode="contain"
            />
          ) : null}
          <Button
            title={sharingQr ? "Preparing..." : "Share QR code"}
            onPress={handleShareQrCode}
            loading={sharingQr}
            style={styles.shareBtn}
          />
        </View>

        <Text style={styles.sectionTitle}>Business hours</Text>
        <View style={styles.timeRow}>
          <Input label="Opens" value={openTime} onChangeText={setOpenTime} placeholder="09:00" style={styles.timeInput} />
          <Input label="Closes" value={closeTime} onChangeText={setCloseTime} placeholder="20:00" style={styles.timeInput} />
        </View>
        <View style={styles.daysRow}>
          {DAYS.map((label, index) => (
            <Pressable
              key={label}
              onPress={() => toggleDay(index)}
              style={[styles.dayChip, workingDays.includes(index) && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, workingDays.includes(index) && styles.dayChipTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <Button title="Save changes" onPress={() => saveMutation.mutate()} loading={saveMutation.isPending} style={styles.saveBtn} />
        <Button title="Log out" variant="danger" onPress={handleLogout} style={styles.logoutBtn} />

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Delete account</Text>
          <Text style={styles.dangerBody}>
            Permanently close this salon account and sign out everywhere. This can't be undone.
          </Text>
          <Pressable onPress={confirmDelete} disabled={deleteMutation.isPending} style={styles.deleteBtn}>
            {deleteMutation.isPending ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <Text style={styles.deleteBtnText}>Delete my account</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
      <BottomTabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  hero: { alignItems: "center", paddingVertical: 8, marginBottom: 8 },
  // Separate wrapper (no overflow:hidden) so the edit badge below can sit on
  // top of the circular photo without being clipped by its circular mask.
  logoWrapper: { width: 112, height: 112 },
  logoPicker: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  logo: { width: "100%", height: "100%" },
  logoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryDark,
    borderWidth: 3,
    borderColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primaryDeep,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  heroName: { fontSize: 20, fontFamily: fonts.displayBold, color: colors.text, marginTop: 12, textAlign: "center" },
  heroSubtitle: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.sansBold,
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 18,
  },
  fieldLabel: { fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.text, marginBottom: 6 },
  qrCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    gap: 14,
  },
  qr: { width: "100%", height: 260 },
  shareBtn: { alignSelf: "stretch" },
  timeRow: { flexDirection: "row", gap: 12 },
  timeInput: { flex: 1 },
  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 12, fontFamily: fonts.sansBold, color: colors.textMuted },
  dayChipTextActive: { color: "#fff" },
  saveBtn: { marginTop: 24 },
  logoutBtn: { marginTop: 12 },
  dangerZone: { marginTop: 28, paddingTop: 18, borderTopWidth: 1, borderTopColor: colors.border },
  dangerTitle: { fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.text, marginBottom: 4 },
  dangerBody: { fontSize: 12, color: colors.textMuted, lineHeight: 17, marginBottom: 12 },
  deleteBtn: { alignSelf: "flex-start", paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.danger },
  deleteBtnText: { fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.danger },
});
