import { MapContainer, TileLayer, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { isValidProjectCoordinates } from "../utils/geo";

interface ProjectSiteMapProps {
  latitude?: number | null;
  longitude?: number | null;
  height?: number;
}

export function ProjectSiteMap({ latitude, longitude, height = 180 }: ProjectSiteMapProps) {
  if (!isValidProjectCoordinates(latitude, longitude)) {
    return (
      <div
        className="rounded-xl border border-dashed border-amber-300 bg-amber-50 flex items-center justify-center text-sm text-amber-800 px-4 text-center"
        style={{ height }}
      >
        Emplacement non défini — ajoutez-le pour activer la météo PVGIS
      </div>
    );
  }

  const center: [number, number] = [latitude!, longitude!];

  return (
    <div className="project-site-map rounded-xl overflow-hidden border border-gray-200" style={{ height }}>
      <MapContainer
        center={center}
        zoom={14}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        zoomControl={false}
        preferCanvas
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <CircleMarker
          center={center}
          radius={10}
          pathOptions={{ fillColor: "#4CAF50", color: "#fff", weight: 3, fillOpacity: 0.95 }}
        />
      </MapContainer>
    </div>
  );
}

export default ProjectSiteMap;
