import React, { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { Loader2, LocateFixed, MapPin, Navigation, Search, Sparkles } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { toast } from "sonner";
import geocodingService, { GeocodingResult } from "../services/geocodingService";
import {
  TUNISIA_BOUNDS,
  TUNISIA_CENTER,
  TUNISIA_ZOOM,
  formatCoordinates,
  isValidProjectCoordinates,
  isWithinTunisiaBounds,
} from "../utils/geo";

export interface LocationValue {
  location: string;
  latitude: number | null;
  longitude: number | null;
}

interface LocationPickerProps {
  value: LocationValue;
  onChange: (value: LocationValue) => void;
  compact?: boolean;
  showStatus?: boolean;
  error?: string;
  /** When true, recalculates map size (e.g. modal just opened). */
  active?: boolean;
  /** Set false to unmount Leaflet (avoids tile bleed in scrollable modals). */
  showMap?: boolean;
  /** Called when user wants to reveal the map again (e.g. from placeholder). */
  onRequestMap?: () => void;
  /** When true, render search/status only — pair with <LocationMap /> in a fixed modal band. */
  mapDetached?: boolean;
}

function MapViewSync({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

function MapInvalidateSize({ active }: { active?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const run = () => map.invalidateSize({ animate: false });
    run();
    const t1 = window.setTimeout(run, 100);
    const t2 = window.setTimeout(run, 350);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [map, active]);
  return null;
}

function MapClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPicker({
  value,
  onChange,
  compact = false,
  showStatus = true,
  error,
  active = true,
  showMap = true,
  onRequestMap,
  mapDetached = false,
}: LocationPickerProps) {
  const [query, setQuery] = useState(value.location || "");
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const hasValidCoords = isValidProjectCoordinates(value.latitude, value.longitude);

  const mapCenter = useMemo<[number, number]>(() => {
    if (hasValidCoords) return [value.latitude!, value.longitude!];
    return TUNISIA_CENTER;
  }, [hasValidCoords, value.latitude, value.longitude]);

  const mapZoom = hasValidCoords ? 14 : TUNISIA_ZOOM;

  useEffect(() => {
    setQuery(value.location || "");
  }, [value.location]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const results = await geocodingService.search(q);
        setSuggestions(results);
      } catch {
        setSearchError("Recherche indisponible. Cliquez sur la carte.");
        setSuggestions([]);
      } finally {
        setSearching(false);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query]);

  const applyCoordinates = useCallback(
    async (latitude: number, longitude: number, locationLabel?: string) => {
      setResolving(true);
      try {
        const label =
          locationLabel?.trim() ||
          (await geocodingService.reverse(latitude, longitude));
        onChange({ location: label, latitude, longitude });
        setQuery(label);
        setSuggestions([]);
      } catch {
        const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        onChange({ location: fallback, latitude, longitude });
        setQuery(fallback);
        setSuggestions([]);
      } finally {
        setResolving(false);
      }
    },
    [onChange]
  );

  const handleSelectSuggestion = (item: GeocodingResult) => {
    applyCoordinates(item.latitude, item.longitude, item.displayName);
  };

  const handleGeolocate = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Géolocalisation indisponible sur ce navigateur.");
      return;
    }

    setGeoLoading(true);
    setSearchError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latitude = Number(pos.coords.latitude.toFixed(6));
        const longitude = Number(pos.coords.longitude.toFixed(6));

        if (!isWithinTunisiaBounds(latitude, longitude)) {
          toast.error("Position hors Tunisie. Cliquez sur la carte pour ajuster.");
          setGeoLoading(false);
          return;
        }

        void applyCoordinates(latitude, longitude).then(() => {
          toast.success("Position GPS détectée");
          setGeoLoading(false);
        });
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? "Autorisez l'accès à la position dans votre navigateur."
            : "Impossible d'obtenir votre position GPS.";
        toast.error(message);
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60_000 }
    );
  };

  const mapHeight = compact ? 220 : 280;

  return (
    <div className="space-y-3">
      {showStatus && (
        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
            hasValidCoords
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              {hasValidCoords
                ? "Emplacement prêt pour PVGIS (météo / irradiation)"
                : "Emplacement requis pour le dimensionnement météo"}
            </p>
            <p className="text-xs mt-0.5 opacity-80">
              Utilisez le GPS, recherchez une adresse ou cliquez sur la carte pour placer le site
              d&apos;installation.
            </p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher : Tunis, Sfax, Sousse…"
            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary bg-white"
          />
          {(searching || resolving) && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
          )}
        </div>
        <button
          type="button"
          onClick={handleGeolocate}
          disabled={geoLoading || resolving}
          title="Localiser ma position GPS"
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/10 disabled:opacity-50 transition-colors"
        >
          {geoLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LocateFixed className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Ma position</span>
        </button>
      </div>

      {searchError && (
        <p className="text-xs text-amber-700">{searchError}</p>
      )}

      {suggestions.length > 0 && (
        <ul className="rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden max-h-44 overflow-y-auto z-20 relative">
          {suggestions.map((item) => (
            <li key={`${item.latitude}-${item.longitude}-${item.displayName}`}>
              <button
                type="button"
                onClick={() => handleSelectSuggestion(item)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-slate-50 border-b border-gray-100 last:border-0 flex items-start gap-2"
              >
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <span>{item.displayName}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {mapDetached ? null : showMap ? (
      <div
        className="location-picker-map relative rounded-xl overflow-hidden border border-gray-200 shadow-inner"
        style={{ height: mapHeight }}
      >
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          minZoom={5}
          maxZoom={18}
          maxBounds={TUNISIA_BOUNDS}
          maxBoundsViscosity={1}
          scrollWheelZoom
          preferCanvas
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapInvalidateSize active={active && showMap} />
          <MapViewSync center={mapCenter} zoom={mapZoom} />
          <MapClickHandler onPick={(lat, lon) => applyCoordinates(lat, lon)} />
          {hasValidCoords && (
            <CircleMarker
              center={[value.latitude!, value.longitude!]}
              radius={10}
              pathOptions={{
                fillColor: "#4CAF50",
                color: "#ffffff",
                weight: 3,
                fillOpacity: 0.95,
              }}
            />
          )}
        </MapContainer>

        <div className="location-picker-overlay absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-3 py-1.5 text-xs font-medium text-secondary shadow">
            <Navigation className="w-3.5 h-3.5 text-primary" />
            Cliquez sur la carte pour positionner
          </span>
          {hasValidCoords && (
            <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-mono text-secondary shadow">
              {formatCoordinates(value.latitude, value.longitude)}
            </span>
          )}
        </div>
      </div>
      ) : (
        <button
          type="button"
          onClick={onRequestMap}
          className="w-full rounded-xl border border-dashed border-gray-300 bg-slate-50 flex flex-col items-center justify-center gap-1.5 text-sm text-muted-foreground hover:bg-slate-100 transition-colors"
          style={{ height: mapHeight }}
        >
          <MapPin className="w-5 h-5 text-primary" />
          {hasValidCoords ? (
            <span className="font-mono text-xs text-secondary">
              {formatCoordinates(value.latitude, value.longitude)}
            </span>
          ) : (
            <span>Aucun point sélectionné</span>
          )}
          <span className="text-xs">Cliquer pour réafficher la carte</span>
        </button>
      )}

      {(error || !hasValidCoords) && (
        <p className={`text-xs ${error ? "text-red-600" : "text-muted-foreground"}`}>
          {error || "Utilisez « Ma position », la carte ou la recherche d'adresse."}
        </p>
      )}
    </div>
  );
}

export default LocationPicker;
