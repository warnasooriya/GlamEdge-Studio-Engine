import { useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button } from "./Button";
import { colors, fonts } from "@/lib/theme";

interface RescheduleModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (proposedBookingTime: string) => void;
  loading?: boolean;
}

export function RescheduleModal({ visible, onClose, onSubmit, loading }: RescheduleModalProps) {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(Platform.OS === "ios");

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Propose new time</Text>

          {Platform.OS === "android" && !showPicker ? (
            <Pressable style={styles.androidTrigger} onPress={() => setShowPicker(true)}>
              <Text style={styles.androidTriggerText}>{date.toLocaleString()}</Text>
            </Pressable>
          ) : null}

          {showPicker ? (
            <DateTimePicker
              value={date}
              mode="datetime"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              minimumDate={new Date()}
              onChange={(_event, selected) => {
                if (Platform.OS === "android") setShowPicker(false);
                if (selected) setDate(selected);
              }}
            />
          ) : null}

          <View style={styles.actions}>
            <Button title="Cancel" variant="secondary" onPress={onClose} style={styles.actionBtn} />
            <Button
              title="Propose"
              onPress={() => onSubmit(date.toISOString())}
              loading={loading}
              style={styles.actionBtn}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  title: { fontSize: 18, fontFamily: fonts.displayBold, color: colors.text, marginBottom: 16 },
  androidTrigger: { padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 16 },
  androidTriggerText: { fontSize: 15, fontFamily: fonts.sans, color: colors.text },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  actionBtn: { flex: 1 },
});
