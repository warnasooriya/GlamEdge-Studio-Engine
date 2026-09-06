import { useState } from "react";
import { Alert, FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listMessages, sendMessage } from "@/api/appointments";
import { blockClient } from "@/api/moderation";
import { ReportModal } from "@/components/ReportModal";
import { colors, fonts } from "@/lib/theme";

export function ChatThread({
  appointmentId,
  clientId,
  clientName,
}: {
  appointmentId: string;
  clientId?: string | null;
  clientName?: string | null;
}) {
  const [text, setText] = useState("");
  // Guideline 1.2: client-written messages need a report route, and the client
  // behind them needs to be blockable.
  const [reportingId, setReportingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const blockMutation = useMutation({
    mutationFn: () => blockClient(clientId!),
    onSuccess: () => Alert.alert("Client blocked", `${clientName ?? "This client"} can no longer message or book with you.`),
    onError: (err: any) =>
      Alert.alert("Couldn't block", err?.response?.data?.error ?? "Something went wrong. Please try again."),
  });

  function confirmBlock() {
    if (!clientId) return;
    Alert.alert(
      `Block ${clientName ?? "this client"}?`,
      "They won't be able to send you messages or make new online bookings. You can undo this from Profile.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Block", style: "destructive", onPress: () => blockMutation.mutate() },
      ]
    );
  }

  const { data: messages } = useQuery({
    queryKey: ["appointment-messages", appointmentId],
    queryFn: () => listMessages(appointmentId),
    refetchInterval: 10_000,
  });

  const mutation = useMutation({
    mutationFn: (input: { text?: string; attachment?: { uri: string; name: string; type: string } }) =>
      sendMessage(appointmentId, input),
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({ queryKey: ["appointment-messages", appointmentId] });
    },
  });

  async function pickAndSendImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    mutation.mutate({
      attachment: {
        uri: asset.uri,
        name: asset.fileName || "photo.jpg",
        type: asset.mimeType || "image/jpeg",
      },
    });
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <FlatList
        data={messages ?? []}
        keyExtractor={(m) => m._id}
        inverted
        style={styles.list}
        renderItem={({ item }) => (
          <Pressable
            onLongPress={() => item.senderType !== "OWNER" && setReportingId(item._id)}
            delayLongPress={350}
            style={[styles.bubble, item.senderType === "OWNER" ? styles.bubbleOwner : styles.bubbleClient]}
          >
            <Text style={styles.senderName}>{item.senderName}</Text>
            {item.text ? <Text style={styles.bubbleText}>{item.text}</Text> : null}
            {item.attachment ? (
              <Image source={{ uri: item.attachment.url }} style={styles.attachmentImage} resizeMode="cover" />
            ) : null}
            {item.senderType !== "OWNER" ? <Text style={styles.holdHint}>Hold to report</Text> : null}
          </Pressable>
        )}
      />
      {clientId ? (
        <Pressable onPress={confirmBlock} style={styles.blockRow} disabled={blockMutation.isPending}>
          <Ionicons name="ban-outline" size={14} color={colors.danger} />
          <Text style={styles.blockText}>Block this client</Text>
        </Pressable>
      ) : null}

      <View style={styles.inputRow}>
        <Pressable onPress={pickAndSendImage} style={styles.iconButton} disabled={mutation.isPending}>
          <Ionicons name="image-outline" size={22} color={colors.primary} />
        </Pressable>
        <TextInput
          style={styles.input}
          placeholder="Message the client..."
          value={text}
          onChangeText={setText}
          multiline
        />
        <Pressable
          onPress={() => text.trim() && mutation.mutate({ text: text.trim() })}
          style={styles.iconButton}
          disabled={mutation.isPending || !text.trim()}
        >
          <Ionicons name="send" size={20} color={text.trim() ? colors.primary : colors.textMuted} />
        </Pressable>
      </View>

      <ReportModal
        visible={!!reportingId}
        onClose={() => setReportingId(null)}
        targetType="MESSAGE"
        targetId={reportingId ?? ""}
        title="Report message"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { maxHeight: 360 },
  bubble: { maxWidth: "80%", borderRadius: 14, padding: 10, marginVertical: 4, marginHorizontal: 12 },
  bubbleOwner: { alignSelf: "flex-end", backgroundColor: colors.primaryLight },
  bubbleClient: { alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  senderName: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.textMuted, marginBottom: 2 },
  bubbleText: { fontSize: 14, fontFamily: fonts.sans, color: colors.text },
  holdHint: { fontSize: 9, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 4 },
  blockRow: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8 },
  blockText: { fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.danger },
  attachmentImage: { width: 180, height: 180, borderRadius: 10, marginTop: 4 },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 10,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconButton: { padding: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 14,
    fontFamily: fonts.sans,
  },
});
