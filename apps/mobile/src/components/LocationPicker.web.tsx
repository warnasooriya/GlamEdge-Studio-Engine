import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchPlaceAutocomplete, fetchPlaceLocation, isPlacesConfigured, PlaceSuggestion } from "@/lib/places";
import { colors, fonts } from "@/lib/theme";

// react-native-maps has no web implementation at all, and this app doesn't ship
// to web — this file exists purely so Metro's web bundling (used for this
// project's own verification tooling) doesn't fail on the native-only import.
// Metro picks this file automatically for web builds via the .web.tsx extension.
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasSelection = lat !== null && lng !== null;

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const results = await fetchPlaceAutocomplete(query).catch(() => []);
      setSuggestions(results);
      setSearching(false);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  async function handleSelectSuggestion(suggestion: PlaceSuggestion) {
    setQuery(suggestion.description);
    setSuggestions([]);
    const location = await fetchPlaceLocation(suggestion.placeId).catch(() => null);
    if (location) onChange(location.lat, location.lng);
  }

  if (!isPlacesConfigured()) {
    return (
      <View style={styles.disabledBox}>
        <Text style={styles.disabledText}>Map picker isn't configured yet.</Text>
      </View>
    );
  }

  const staticMapUrl = hasSelection
    ? `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=600x300&markers=color:0xf0367e%7C${lat},${lng}&key=${API_KEY}`
    : null;

  return (
    <View>
      <View style={styles.searchRow}>
        <Ionicons name="search-outline" size={16} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for your salon's address..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
        {searching ? <ActivityIndicator size="small" color={colors.primary} /> : null}
      </View>

      {suggestions.length > 0 ? (
        <View style={styles.suggestionsBox}>
          {suggestions.map((s) => (
            <Pressable key={s.placeId} style={styles.suggestionRow} onPress={() => handleSelectSuggestion(s)}>
              <Ionicons name="location-outline" size={15} color={colors.textMuted} />
              <Text style={styles.suggestionText} numberOfLines={2}>
                {s.description}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {staticMapUrl ? (
        <View style={styles.mapWrap}>
          <Image source={{ uri: staticMapUrl }} style={styles.map} resizeMode="cover" />
        </View>
      ) : null}

      <Text style={styles.pinnedText}>
        {hasSelection ? `Pinned: ${lat!.toFixed(5)}, ${lng!.toFixed(5)}` : "Search for your salon's address to pin it."}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  disabledBox: { borderWidth: 1, borderStyle: "dashed", borderColor: colors.border, borderRadius: 12, padding: 16 },
  disabledText: { fontSize: 12, fontFamily: fonts.sans, color: colors.textMuted },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  searchIcon: { marginRight: 6 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, fontFamily: fonts.sans, color: colors.text },
  suggestionsBox: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    marginTop: 4,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  suggestionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  suggestionText: { flex: 1, fontSize: 13, fontFamily: fonts.sans, color: colors.text },
  mapWrap: { height: 220, borderRadius: 14, overflow: "hidden", marginTop: 10 },
  map: { width: "100%", height: "100%" },
  pinnedText: { fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted, marginTop: 8 },
});
