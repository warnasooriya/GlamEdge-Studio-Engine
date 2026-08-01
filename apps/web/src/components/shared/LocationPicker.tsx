import { useCallback, useRef, useState } from "react";
import { GoogleMap, Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const LIBRARIES: "places"[] = ["places"];
const MAP_CONTAINER_STYLE = { width: "100%", height: "280px", borderRadius: "0.75rem" };
const DEFAULT_CENTER = { lat: 6.9271, lng: 79.8612 }; // Colombo, Sri Lanka

export function LocationPicker({
  apiKey,
  lat,
  lng,
  onChange,
}: {
  apiKey: string;
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const { isLoaded, loadError } = useJsApiLoader({ googleMapsApiKey: apiKey, libraries: LIBRARIES });
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [pinCenter, setPinCenter] = useState(lat !== null && lng !== null ? { lat, lng } : DEFAULT_CENTER);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const hasSelection = lat !== null && lng !== null;

  const handlePlaceChanged = useCallback(() => {
    const place = autocompleteRef.current?.getPlace();
    const location = place?.geometry?.location;
    if (!location) return;
    const next = { lat: location.lat(), lng: location.lng() };
    setPinCenter(next);
    onChange(next.lat, next.lng);
    map?.panTo(next);
    map?.setZoom(16);
  }, [map, onChange]);

  function handlePinLocation() {
    const c = map?.getCenter();
    if (!c) return;
    setPinCenter({ lat: c.lat(), lng: c.lng() });
    onChange(c.lat(), c.lng());
  }

  if (!apiKey) {
    return (
      <p className="rounded-lg border border-dashed border-plum-200 bg-plum-50/50 p-4 text-xs text-plum-400 dark:border-white/15 dark:bg-white/5 dark:text-cream-100/50">
        Map picker isn't configured yet — set <code>VITE_GOOGLE_MAPS_API_KEY</code> to enable it.
      </p>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-lg border border-dashed border-rose-200 bg-rose-50 p-4 text-xs text-rose-500">
        Couldn't load Google Maps. Check the API key and enabled APIs.
      </p>
    );
  }

  if (!isLoaded) {
    return (
      <p className="rounded-lg border border-plum-100 bg-white/60 p-4 text-xs text-plum-400 dark:border-white/10 dark:bg-white/5 dark:text-cream-100/50">
        Loading map...
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Autocomplete onLoad={(a) => (autocompleteRef.current = a)} onPlaceChanged={handlePlaceChanged}>
        <Input placeholder="Search for your salon's address..." />
      </Autocomplete>

      <div className="relative overflow-hidden rounded-xl">
        <GoogleMap
          mapContainerStyle={MAP_CONTAINER_STYLE}
          center={pinCenter}
          zoom={hasSelection ? 16 : 12}
          onLoad={(m) => setMap(m)}
          onDragEnd={() => {
            const c = map?.getCenter();
            if (c) setPinCenter({ lat: c.lat(), lng: c.lng() });
          }}
          options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
        />
        {/* Fixed center pin — the map pans underneath it; "Pin this location" captures whatever it's over. */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <MapPin className="h-9 w-9 fill-brand-500 text-brand-700 drop-shadow-md" strokeWidth={1.5} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-plum-400 dark:text-cream-100/50">
          {hasSelection ? `Pinned: ${lat!.toFixed(5)}, ${lng!.toFixed(5)}` : "Search your salon, or drag the map to move the pin."}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={handlePinLocation}>
          <MapPin className="h-3.5 w-3.5" /> Pin this location
        </Button>
      </div>
    </div>
  );
}
