const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export interface PlaceSuggestion {
  placeId: string;
  description: string;
}

export function isPlacesConfigured(): boolean {
  return Boolean(API_KEY);
}

export async function fetchPlaceAutocomplete(input: string): Promise<PlaceSuggestion[]> {
  if (!API_KEY || !input.trim()) return [];
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
    input
  )}&key=${API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== "OK") return [];
  return (json.predictions ?? []).map((p: any) => ({ placeId: p.place_id, description: p.description }));
}

export async function fetchPlaceLocation(placeId: string): Promise<{ lat: number; lng: number } | null> {
  if (!API_KEY) return null;
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  const location = json.result?.geometry?.location;
  if (!location) return null;
  return { lat: location.lat, lng: location.lng };
}
