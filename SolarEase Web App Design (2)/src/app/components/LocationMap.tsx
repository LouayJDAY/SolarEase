import React, { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, useMap, useMapEvents } from "react-leaflet";
import { Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";
import geocodingService from "../services/geocodingService";
import {
  TUNISIA_BOUNDS,
  TUNISIA_CENTER,
  TUNISIA_ZOOM,
  formatCoordinates,
  isValidProjectCoordinates,
} from "../utils/geo";
import type { LocationValue } from "./LocationPicker";

interface LocationMapProps {
  value: LocationValue;
  /** Raw click handler (coordinates only). */
  onPick?: (latitude: number, longitude: number) => void;
  /** Full update with reverse geocoding (preferred in modals). */
  onChange?: (value: LocationValue) => void;
  compact?: boolean;
  active?: boolean;
  modal?: boolean;
}

function MapViewSync({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: false });
  }, [center, zoom, map]);
  return null;
}

function MapInvalidateSize({ active }: { active?: boolean }) {
  const map = useMap();
  useEffect(() => {
    const run = () => map.invalidateSize({ animate: false });
    run();
    const t1 = window.setTimeout(run, 100);
    const t2 = window.setTimeout(run, 400);
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

export function LocationMap({
  value,
  onPick,
  onChange,
  compact = false,
  active = true,
  modal = false,
}: LocationMapProps) {
  const hasValidCoords = isValidProjectCoordinates(value.latitude, value.longitude);

  const handlePick = async (latitude: number, longitude: number) => {
    if (onPick) {
      onPick(latitude, longitude);
      return;
    }
    if (!onChange) return;
    try {
      const label = await geocodingService.reverse(latitude, longitude);
      onChange({ location: label, latitude, longitude });
    } catch {
      onChange({
        location: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
        latitude,
        longitude,
      });
    }
  };

  const mapCenter = useMemo<[number, number]>(() => {
    if (hasValidCoords) return [value.latitude!, value.longitude!];
    return TUNISIA_CENTER;
  }, [hasValidCoords, value.latitude, value.longitude]);

  const mapZoom = hasValidCoords ? 14 : TUNISIA_ZOOM;
  const mapHeight = compact ? (modal ? 180 : 220) : 280;

  if (!active) {
    return (
      <div
        className="rounded-xl border border-gray-200 bg-slate-100"
        style={{ height: mapHeight }}
      />
    );
  }

  return (
    <div
      className={`location-picker-map modal-leaflet-host relative rounded-xl overflow-hidden border border-gray-200 shadow-inner ${
        modal ? "modal-leaflet-host--modal" : ""
      }`}
      style={{ height: mapHeight }}
    >
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        minZoom={5}
        maxZoom={18}
        maxBounds={TUNISIA_BOUNDS}
        maxBoundsViscosity={1}
        scrollWheelZoom={!modal}
        preferCanvas
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapInvalidateSize active={active} />
        <MapViewSync center={mapCenter} zoom={mapZoom} />
        <MapClickHandler onPick={handlePick} />
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
          Cliquez sur la carte
        </span>
        {hasValidCoords && (
          <span className="rounded-lg bg-white/95 px-3 py-1.5 text-xs font-mono text-secondary shadow">
            {formatCoordinates(value.latitude, value.longitude)}
          </span>
        )}
      </div>
    </div>
  );
}

export default LocationMap;
