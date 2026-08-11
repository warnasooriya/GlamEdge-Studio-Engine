import { useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listMessages, sendMessage } from "@/api/appointments";
import { colors, fonts } from "@/lib/theme";

export function ChatThread({ appointmentId }: { appointmentId: string }) {
  const [text, setText] = useState("");
  const queryClient = useQueryClient();

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
          <View style={[styles.bubble, item.senderType === "OWNER" ? styles.bubbleOwner : styles.bubbleClient]}>
            <Text style={styles.senderName}>{item.senderName}</Text>
            {item.text ? <Text style={styles.bubbleText}>{item.text}</Text> : null}
            {item.attachment ? (
              <Image source={{ uri: item.attachment.url }} style={styles.attachmentImage} resizeMode="cover" />
            ) : null}
          </View>
        )}
      />
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
