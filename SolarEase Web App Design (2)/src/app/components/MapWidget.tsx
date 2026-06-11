import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import projectService, { ProjectResponse } from "../services/projectService";
import { isValidProjectCoordinates } from "../utils/geo";

function statusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
      return "#22c55e";
    case "IN_PROGRESS":
    case "INSTALLATEUR_AFFECTE":
    case "EN_PREPARATION":
      return "#f97316";
    default:
      return "#9ca3af";
  }
}

export function MapWidget() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectService
      .getProjects({ page: 0, size: 50 })
      .then((page) => setProjects(page.content ?? []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  const mapped = useMemo(
    () =>
      projects.filter((p) =>
        isValidProjectCoordinates(p.latitude, p.longitude)
      ),
    [projects]
  );

  const center = useMemo((): [number, number] => {
    if (mapped.length === 0) return [36.8065, 10.1815];
    const lat =
      mapped.reduce((sum, p) => sum + (p.latitude ?? 0), 0) / mapped.length;
    const lon =
      mapped.reduce((sum, p) => sum + (p.longitude ?? 0), 0) / mapped.length;
    return [lat, lon];
  }, [mapped]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="font-semibold text-secondary">Carte des Projets</h3>
        <p className="text-sm text-muted-foreground mt-1">Localisation des sites actifs</p>
      </div>

      <div className="p-6">
        <div className="relative w-full h-80 rounded-lg border-2 border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Chargement...
            </div>
          ) : mapped.length === 0 ? (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              Aucun projet avec coordonnées GPS
            </div>
          ) : (
            <MapContainer center={center} zoom={7} className="h-full w-full" scrollWheelZoom={false}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {mapped.map((project) => (
                <CircleMarker
                  key={project.id}
                  center={[project.latitude!, project.longitude!]}
                  radius={8}
                  pathOptions={{
                    color: statusColor(project.status),
                    fillColor: statusColor(project.status),
                    fillOpacity: 0.85,
                  }}
                >
                  <Popup>
                    <strong>{project.name}</strong>
                    <br />
                    {project.location}
                    <br />
                    <span className="text-xs">{project.status}</span>
                  </Popup>
                </CircleMarker>
              ))}
            </MapContainer>
          )}
        </div>
      </div>
    </div>
  );
}
