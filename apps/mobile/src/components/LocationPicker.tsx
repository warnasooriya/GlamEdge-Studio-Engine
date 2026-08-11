import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { fetchPlaceAutocomplete, fetchPlaceLocation, isPlacesConfigured, PlaceSuggestion } from "@/lib/places";
import { colors, fonts } from "@/lib/theme";

const DEFAULT_REGION = { latitude: 6.9271, longitude: 79.8612, latitudeDelta: 0.05, longitudeDelta: 0.05 }; // Colombo

interface LocationPickerProps {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}

export function LocationPicker({ lat, lng, onChange }: LocationPickerProps) {
  const mapRef = useRef<MapView>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
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

  function moveTo(latitude: number, longitude: number) {
    onChange(latitude, longitude);
    mapRef.current?.animateToRegion({ latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 400);
  }

  async function handleSelectSuggestion(suggestion: PlaceSuggestion) {
    setQuery(suggestion.description);
    setSuggestions([]);
    const location = await fetchPlaceLocation(suggestion.placeId).catch(() => null);
    if (location) moveTo(location.lat, location.lng);
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const position = await Location.getCurrentPositionAsync({});
      moveTo(position.coords.latitude, position.coords.longitude);
    } finally {
      setLocating(false);
    }
  }

  if (!isPlacesConfigured()) {
    return (
      <View style={styles.disabledBox}>
        <Text style={styles.disabledText}>Map picker isn't configured yet.</Text>
      </View>
    );
  }

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

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          style={styles.map}
          initialRegion={
            hasSelection ? { latitude: lat!, longitude: lng!, latitudeDelta: 0.01, longitudeDelta: 0.01 } : DEFAULT_REGION
          }
          onPress={(e) => onChange(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
        >
          {hasSelection ? (
            <Marker
              coordinate={{ latitude: lat!, longitude: lng! }}
              draggable
              onDragEnd={(e) => onChange(e.nativeEvent.coordinate.latitude, e.nativeEvent.coordinate.longitude)}
              pinColor={colors.primary}
            />
          ) : null}
        </MapView>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.pinnedText}>
          {hasSelection ? `Pinned: ${lat!.toFixed(5)}, ${lng!.toFixed(5)}` : "Search, tap the map, or use your current location."}
        </Text>
        <Pressable style={styles.locateBtn} onPress={handleUseCurrentLocation} disabled={locating}>
          {locating ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="locate-outline" size={14} color={colors.primary} />
          )}
          <Text style={styles.locateBtnText}>Use current location</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disabledBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
  },
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
  map: { flex: 1 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 },
  pinnedText: { flex: 1, fontSize: 11, fontFamily: fonts.sans, color: colors.textMuted },
  locateBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: colors.primaryLight },
  locateBtnText: { fontSize: 11, fontFamily: fonts.sansBold, color: colors.primaryDark },
});
