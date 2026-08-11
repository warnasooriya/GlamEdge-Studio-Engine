import { useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Button } from "./Button";
import { CategoryBadge } from "./CategoryBadge";
import { colors, fonts } from "@/lib/theme";
import { CategoryType } from "@/types";
import { FeedMediaFile } from "@/api/feed";

const CATEGORIES: CategoryType[] = ["LADIES", "GENTS", "KIDS"];

interface PickedAsset extends FeedMediaFile {
  isVideo: boolean;
}

interface CreatePostModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: { category: CategoryType; caption?: string; tags?: string; media: FeedMediaFile[] }) => void;
  loading?: boolean;
}

export function CreatePostModal({ visible, onClose, onSubmit, loading }: CreatePostModalProps) {
  const [category, setCategory] = useState<CategoryType>("LADIES");
  const [caption, setCaption] = useState("");
  const [tags, setTags] = useState("");
  const [assets, setAssets] = useState<PickedAsset[]>([]);

  async function pickMedia() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });
    if (result.canceled) return;
    const picked: PickedAsset[] = result.assets.map((asset, i) => {
      const isVideo = asset.type === "video";
      return {
        uri: asset.uri,
        name: asset.fileName || `media-${Date.now()}-${i}.${isVideo ? "mp4" : "jpg"}`,
        type: asset.mimeType || (isVideo ? "video/mp4" : "image/jpeg"),
        isVideo,
      };
    });
    setAssets((prev) => [...prev, ...picked].slice(0, 10));
  }

  function removeAsset(uri: string) {
    setAssets((prev) => prev.filter((a) => a.uri !== uri));
  }

  function reset() {
    setCategory("LADIES");
    setCaption("");
    setTags("");
    setAssets([]);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleSubmit() {
    onSubmit({ category, caption: caption.trim() || undefined, tags: tags.trim() || undefined, media: assets });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>New post</Text>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.chipRow}>
              {CATEGORIES.map((c) => (
                <Pressable key={c} onPress={() => setCategory(c)} style={category === c && styles.chipSelected}>
                  <CategoryBadge category={c} />
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.picker} onPress={pickMedia}>
              <Ionicons name="images-outline" size={20} color={colors.primary} />
              <Text style={styles.pickerText}>Add photos or a video ({assets.length}/10)</Text>
            </Pressable>

            {assets.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbRow}>
                {assets.map((a) => (
                  <View key={a.uri} style={styles.thumbWrap}>
                    <Image source={{ uri: a.uri }} style={styles.thumb} />
                    {a.isVideo ? (
                      <View style={styles.videoBadge}>
                        <Ionicons name="videocam" size={12} color="#fff" />
                      </View>
                    ) : null}
                    <Pressable style={styles.removeThumb} onPress={() => removeAsset(a.uri)}>
                      <Ionicons name="close" size={12} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}

            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor={colors.textMuted}
              value={caption}
              onChangeText={setCaption}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Tags, comma separated (e.g. balayage, bridal)"
              placeholderTextColor={colors.textMuted}
              value={tags}
              onChangeText={setTags}
            />

            <Button
              title="Post"
              onPress={handleSubmit}
              loading={loading}
              disabled={assets.length === 0}
              style={styles.submitBtn}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontFamily: fonts.displayBold, color: colors.text },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  chipRow: { flexDirection: "row", gap: 8 },
  chipSelected: { transform: [{ scale: 1.05 }] },
  picker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 14,
    padding: 14,
  },
  pickerText: { fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.primary },
  thumbRow: { flexGrow: 0 },
  thumbWrap: { marginRight: 8, position: "relative" },
  thumb: { width: 72, height: 72, borderRadius: 10, backgroundColor: colors.bg },
  videoBadge: {
    position: "absolute",
    bottom: 4,
    left: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 8,
    padding: 3,
  },
  removeThumb: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  captionInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.text,
    minHeight: 70,
    textAlignVertical: "top",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.text,
  },
  submitBtn: { marginTop: 4 },
});
