type Coordinates = { latitude: number; longitude: number };

export async function geocodeRestaurantAddress(address: string): Promise<Coordinates | null> {
  const query = address.trim();
  if (!query) return null;

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "MesaLink/1.0 (info@mesalink.pt)",
        "Accept-Language": "pt-PT,pt;q=0.9",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return null;
    const results = await response.json() as Array<{ lat?: string; lon?: string }>;
    const latitude = Number(results[0]?.lat);
    const longitude = Number(results[0]?.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}
