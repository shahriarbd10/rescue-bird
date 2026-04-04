export type GeoPoint = { lat: number; lng: number };

export function toRad(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineKm(a: GeoPoint, b: GeoPoint) {
  const r = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * r * Math.asin(Math.sqrt(h));
}

export function normalizeArea(area: string) {
  return area.trim().toLowerCase().replace(/\s+/g, " ");
}
