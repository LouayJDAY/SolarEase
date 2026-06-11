export interface GeocodingResult {
  displayName: string;
  latitude: number;
  longitude: number;
}

interface NominatimSearchItem {
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimReverseResponse {
  display_name?: string;
}

const BASE = "/nominatim";

async function nominatimFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error("Geocoding request failed");
  return res.json() as Promise<T>;
}

export const geocodingService = {
  search: async (query: string, limit = 5): Promise<GeocodingResult[]> => {
    const q = query.trim();
    if (q.length < 2) return [];

    const params = new URLSearchParams({
      q,
      format: "json",
      limit: String(limit),
      countrycodes: "tn",
      addressdetails: "0",
    });

    const items = await nominatimFetch<NominatimSearchItem[]>(`/search?${params}`);
    return items.map((item) => ({
      displayName: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    }));
  },

  reverse: async (latitude: number, longitude: number): Promise<string> => {
    const params = new URLSearchParams({
      lat: String(latitude),
      lon: String(longitude),
      format: "json",
    });
    const data = await nominatimFetch<NominatimReverseResponse>(`/reverse?${params}`);
    return data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  },
};

export default geocodingService;
