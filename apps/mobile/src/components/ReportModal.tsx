import { useState } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { REPORT_REASONS, ReportReason, ReportTargetType, reportContent } from "@/api/moderation";
import { colors, fonts } from "@/lib/theme";

// App Store Guideline 1.2 requires a way to report user-generated content. Used
// for client-written reviews and for messages a client sends in a booking chat.
export function ReportModal({
  visible,
  onClose,
  targetType,
  targetId,
  title = "Report content",
}: {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  title?: string;
}) {
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (reason: ReportReason) => reportContent({ targetType, targetId, reason }),
    onSuccess: () => setDone(true),
  });

  function close() {
    setDone(false);
    mutation.reset();
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        {/* Stops a tap inside the sheet from closing it via the backdrop. */}
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          {done ? (
            <View style={styles.doneBox}>
              <Ionicons name="checkmark-circle" size={40} color={colors.primary} />
              <Text style={styles.doneTitle}>Report received</Text>
              <Text style={styles.doneBody}>
                Thanks. Our team reviews reports within 24 hours and will remove anything that breaks our rules.
              </Text>
              <Pressable onPress={close} style={styles.doneBtn}>
                <Text style={styles.doneBtnText}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>Why are you reporting this?</Text>

              {mutation.isError ? (
                <Text style={styles.error}>Couldn't send the report. Please try again.</Text>
              ) : null}

              {REPORT_REASONS.map((r) => (
                <Pressable
                  key={r.value}
                  style={styles.reason}
                  disabled={mutation.isPending}
                  onPress={() => mutation.mutate(r.value)}
                >
                  <Text style={styles.reasonText}>{r.label}</Text>
                  {mutation.isPending && mutation.variables === r.value ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                  )}
                </Pressable>
              ))}

              <Pressable onPress={close} style={styles.cancel} disabled={mutation.isPending}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 34 },
  handle: { alignSelf: "center", width: 38, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 14 },
  title: { fontSize: 17, fontFamily: fonts.sansBold, color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: 12 },
  error: { fontSize: 12, color: colors.danger, marginBottom: 8 },
  reason: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  reasonText: { fontSize: 14, fontFamily: fonts.sans, color: colors.text },
  cancel: { marginTop: 14, alignItems: "center", paddingVertical: 12 },
  cancelText: { fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.textMuted },
  doneBox: { alignItems: "center", paddingVertical: 12 },
  doneTitle: { fontSize: 17, fontFamily: fonts.sansBold, color: colors.text, marginTop: 10 },
  doneBody: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19, marginTop: 6 },
  doneBtn: { marginTop: 18, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 40 },
  doneBtnText: { color: "#fff", fontFamily: fonts.sansSemiBold, fontSize: 14 },
});
