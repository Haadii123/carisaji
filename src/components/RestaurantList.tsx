import { useMemo, useState } from 'react';
import {
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Search,
  Star,
  Utensils,
} from 'lucide-react';
import type { BrandFilter, Restaurant } from '../types';
import {
  BRAND_OPTIONS,
  detectRestaurantBrand,
  getBrandImage,
} from '../utils/format';
import { getGoogleMapsDirectionsUrl } from '../utils/geo';

interface RestaurantListProps {
  restaurants: Restaurant[];
  loading: boolean;
  error: string;
  favoriteIds: number[];
  onToggleFavorite: (id: number) => void;
  onRetry: () => void;
  onSelectRestaurant: (id: number) => void;
}

export function RestaurantList({
  restaurants,
  loading,
  error,
  favoriteIds,
  onToggleFavorite,
  onRetry,
  onSelectRestaurant,
}: RestaurantListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<BrandFilter>('Semua');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [only24Hours, setOnly24Hours] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});

  const filtered = useMemo(() => {
    return restaurants.filter((r) => {
      const brandMatch =
        selectedBrand === 'Semua' ||
        detectRestaurantBrand(r.name) === selectedBrand;
      const favMatch =
        !onlyFavorites || favoriteIds.includes(r.restaurant_id);
      const hoursMatch =
        !only24Hours || r.operating_hours.toLowerCase().includes('24 jam');
      const q = searchQuery.trim().toLowerCase();
      const queryMatch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q);
      return brandMatch && favMatch && hoursMatch && queryMatch;
    });
  }, [
    restaurants,
    selectedBrand,
    onlyFavorites,
    only24Hours,
    favoriteIds,
    searchQuery,
  ]);

  return (
    <section
      aria-label="Daftar Restoran Cepat Saji"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header & Pencarian */}
      <div className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-red-600">
            Restoran · Daftar Gerai
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Daftar Restoran Cepat Saji
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600">
            Jelajahi seluruh gerai makanan cepat saji di Kota Pangkalpinang
            beserta daftar menu dan ulasan pelanggan.
          </p>
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <label htmlFor="daftar-search" className="sr-only">
            Cari nama restoran atau alamat
          </label>
          <input
            id="daftar-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama restoran atau alamat..."
            className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Merek & Preferensi (Tombol Interaktif) */}
      <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          className="flex flex-wrap items-center gap-1.5"
          role="group"
          aria-label="Filter berdasarkan merek"
        >
          {BRAND_OPTIONS.map((brand) => {
            const active = selectedBrand === brand;
            return (
              <button
                key={brand}
                type="button"
                onClick={() => setSelectedBrand(brand)}
                className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-zinc-900 text-white'
                    : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {brand}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-pressed={onlyFavorites}
            onClick={() => setOnlyFavorites((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              onlyFavorites
                ? 'bg-red-600 text-white'
                : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Heart
              className={`h-3.5 w-3.5 ${
                onlyFavorites ? 'fill-white text-white' : 'text-red-500'
              }`}
            />
            <span className="tabular-nums">
              Favorit Saya ({favoriteIds.length})
            </span>
          </button>
          <button
            type="button"
            aria-pressed={only24Hours}
            onClick={() => setOnly24Hours((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              only24Hours
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Buka 24 Jam</span>
          </button>
        </div>
      </div>

      {/* State Error */}
      {error && (
        <div
          role="alert"
          className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* State Loading */}
      {loading && (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div
              key={idx}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white"
            >
              <div className="aspect-4/3 bg-zinc-200 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-3 w-24 rounded bg-zinc-200 animate-pulse" />
                <div className="h-5 w-3/4 rounded bg-zinc-200 animate-pulse" />
                <div className="h-4 w-full rounded bg-zinc-100 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* State Kosong */}
      {!loading && !error && filtered.length === 0 && (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center">
          <p className="font-display text-base font-semibold text-zinc-900">
            Restoran tidak ditemukan
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Tidak ada gerai yang sesuai dengan kata kunci atau filter merek yang
            dipilih.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedBrand('Semua');
              setOnlyFavorites(false);
              setOnly24Hours(false);
            }}
            className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
          >
            Atur Ulang Filter
          </button>
        </div>
      )}

      {/* Grid Kartu Restoran */}
      {!loading && !error && filtered.length > 0 && (
        <>
          <p className="mt-4 text-xs text-zinc-500 tabular-nums">
            Menampilkan {filtered.length} dari {restaurants.length} restoran
          </p>

          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => {
              const brand = detectRestaurantBrand(r.name);
              const imgFailed = failedImages[r.restaurant_id];
              return (
                <article
                  key={r.restaurant_id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="aspect-4/3 w-full overflow-hidden bg-zinc-100">
                    {!imgFailed ? (
                      <img
                        src={getBrandImage(r.name)}
                        alt={r.name}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setFailedImages((prev) => ({
                            ...prev,
                            [r.restaurant_id]: true,
                          }))
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400">
                        <Utensils className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
                        <span className="font-medium text-zinc-600 truncate">
                          {brand}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-zinc-900 tabular-nums shrink-0">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {r.avg_rating > 0
                            ? r.avg_rating.toFixed(1).replace('.', ',')
                            : 'Baru'}
                          <span className="font-normal text-zinc-400">
                            ({r.review_count})
                          </span>
                        </span>
                      </div>

                      <h2 className="mt-1.5 font-display text-lg font-bold text-zinc-950 leading-snug">
                        {r.name}
                      </h2>

                      <p className="mt-2 flex items-start gap-1.5 text-sm text-zinc-600 line-clamp-2 leading-relaxed">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                        <span>{r.address}</span>
                      </p>

                      <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500">
                        <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                        <span>Jam Buka: {r.operating_hours}</span>
                        {typeof r.menu_count === 'number' && (
                          <>
                            <span aria-hidden="true" className="text-zinc-300">
                              ·
                            </span>
                            <span className="tabular-nums">
                              {r.menu_count} menu
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    <div className="mt-5 flex items-center gap-2 border-t border-zinc-100 pt-4">
                      <button
                        type="button"
                        onClick={() => onSelectRestaurant(r.restaurant_id)}
                        className="flex-1 rounded-lg bg-red-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Pesan, Menu &amp; Ulasan
                      </button>
                      <button
                        type="button"
                        aria-label={
                          favoriteIds.includes(r.restaurant_id)
                            ? `Hapus ${r.name} dari favorit`
                            : `Simpan ${r.name} ke favorit`
                        }
                        aria-pressed={favoriteIds.includes(r.restaurant_id)}
                        onClick={() => onToggleFavorite(r.restaurant_id)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer shrink-0"
                      >
                        <Heart
                          className={`h-4 w-4 ${
                            favoriteIds.includes(r.restaurant_id)
                              ? 'fill-red-600 text-red-600'
                              : 'text-zinc-400'
                          }`}
                        />
                      </button>
                      <a
                        href={getGoogleMapsDirectionsUrl(
                          r.latitude,
                          r.longitude
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Petunjuk arah Google Maps untuk ${r.name}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
                      >
                        <span>Rute</span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
