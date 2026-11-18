import type { BrandFilter, MenuItem } from '../types';

export const BRAND_OPTIONS: BrandFilter[] = [
  'Semua',
  'KFC',
  "McDonald's",
  'Richeese Factory',
  'A&W',
  'Almaz Fried Chicken',
  'JChicken',
  'Karen Chicken',
];

/**
 * Memformat angka harga menjadi format Rupiah Indonesia (contoh: Rp 41.500).
 */
export function formatRupiah(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0;
  return `Rp ${safeAmount.toLocaleString('id-ID')}`;
}

/**
 * Mendeteksi merek waralaba dari nama restoran.
 */
export function detectRestaurantBrand(name: string): BrandFilter {
  const lower = name.toLowerCase();
  if (lower.includes('kfc')) return 'KFC';
  if (lower.includes('mcdonald')) return "McDonald's";
  if (lower.includes('richeese')) return 'Richeese Factory';
  if (lower.includes('a&w')) return 'A&W';
  if (lower.includes('almaz')) return 'Almaz Fried Chicken';
  if (lower.includes('jchicken')) return 'JChicken';
  if (lower.includes('karen chicken')) return 'Karen Chicken';
  return 'Lainnya';
}

/**
 * Mengembalikan gambar hidangan representatif berdasarkan merek restoran.
 */
export function getBrandImage(name: string): string {
  const brand = detectRestaurantBrand(name);
  switch (brand) {
    case 'Almaz Fried Chicken':
      return '/src/assets/images/spiced_kebuli_chicken_1794970170763.jpg';
    case 'Richeese Factory':
      return '/src/assets/images/spicy_glazed_chicken_1794970169224.jpg';
    case "McDonald's":
    case 'A&W':
      return '/src/assets/images/gourmet_beef_burger_1794970170630.jpg';
    default:
      return '/src/assets/images/crispy_fried_chicken_1794970168871.jpg';
  }
}

/**
 * Mengelompokkan item menu berdasarkan kategori dengan urutan kemunculan pertama.
 */
export function groupMenusByCategory(
  menus: MenuItem[]
): Array<{ category: string; items: MenuItem[] }> {
  const groups = new Map<string, MenuItem[]>();
  for (const item of menus) {
    const categoryName = item.category?.trim() || 'Menu Lainnya';
    const existing = groups.get(categoryName);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(categoryName, [item]);
    }
  }
  return Array.from(groups.entries()).map(([category, items]) => ({
    category,
    items,
  }));
}

/**
 * Memformat tanggal ke format lokal Indonesia yang ringkas.
 */
export function formatTanggalId(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return isoString;
  }
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
