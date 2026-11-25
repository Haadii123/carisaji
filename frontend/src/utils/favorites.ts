const FAVORITES_KEY = 'carisaji_favorite_restaurants';

export function loadFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((n): n is number => Number.isInteger(n))
      : [];
  } catch {
    return [];
  }
}

export function saveFavoriteIds(ids: number[]): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota errors
  }
}
