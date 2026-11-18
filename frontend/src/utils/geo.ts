export const PANGKALPINANG_CENTER = {
  latitude: -2.1292,
  longitude: 106.1107,
} as const;

export const PRESET_LOCATIONS = [
  {
    label: 'Pusat Kota Pangkalpinang',
    latitude: -2.1292,
    longitude: 106.1107,
  },
  {
    label: 'Alun-Alun Taman Merdeka',
    latitude: -2.1268,
    longitude: 106.1088,
  },
  {
    label: 'Kawasan Selindung / Gabek',
    latitude: -2.1015,
    longitude: 106.1118,
  },
  {
    label: 'Kawasan Solihin GP',
    latitude: -2.1425,
    longitude: 106.0992,
  },
] as const;

/**
 * Menormalkan koordinat apabila urutan X/Y MySQL 8 SRID 4326 tertukar (misal lat > 90).
 */
export function normalizeCoordinates(
  rawLat: number,
  rawLng: number
): { latitude: number; longitude: number } {
  const lat = Number(rawLat);
  const lng = Number(rawLng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return { ...PANGKALPINANG_CENTER };
  }
  if (Math.abs(lat) > 90 && Math.abs(lng) <= 90) {
    return { latitude: lng, longitude: lat };
  }
  return { latitude: lat, longitude: lng };
}

/**
 * Menghitung jarak garis lurus antar dua titik koordinat bumi menggunakan rumus Haversine (dalam kilometer).
 */
export function calculateHaversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Memformat jarak kilometer ke format Bahasa Indonesia (meter jika < 1 km, km jika >= 1 km).
 */
export function formatDistanceId(distanceKm: number): string {
  if (!Number.isFinite(distanceKm) || distanceKm < 0) {
    return '0 m';
  }
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

/**
 * Mengurutkan daftar restoran dari terdekat ke terjauh terhadap titik koordinat asal.
 */
export function sortRestaurantsByDistance<
  T extends { latitude: number; longitude: number }
>(
  restaurants: T[],
  originLat: number,
  originLng: number
): Array<T & { distanceKm: number }> {
  return [...restaurants]
    .map((restaurant) => ({
      ...restaurant,
      distanceKm: calculateHaversineKm(
        originLat,
        originLng,
        restaurant.latitude,
        restaurant.longitude
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * Membuat tautan navigasi Google Maps untuk petunjuk arah ke restoran.
 */
export function getGoogleMapsDirectionsUrl(
  latitude: number,
  longitude: number
): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    `${latitude},${longitude}`
  )}`;
}
