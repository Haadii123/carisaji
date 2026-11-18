import { useMemo, useState } from 'react';
import {
  Clock,
  Crosshair,
  ExternalLink,
  MapPin,
  Navigation,
  Star,
} from 'lucide-react';
import type { Restaurant } from '../types';
import { detectRestaurantBrand } from '../utils/format';
import {
  formatDistanceId,
  getGoogleMapsDirectionsUrl,
  PANGKALPINANG_CENTER,
  PRESET_LOCATIONS,
  sortRestaurantsByDistance,
} from '../utils/geo';

interface NearestRestaurantsProps {
  restaurants: Restaurant[];
  loading: boolean;
  onSelectRestaurant: (id: number) => void;
  onViewOnMap: (id: number) => void;
}

export function NearestRestaurants({
  restaurants,
  loading,
  onSelectRestaurant,
  onViewOnMap,
}: NearestRestaurantsProps) {
  const [origin, setOrigin] = useState<{
    latitude: number;
    longitude: number;
    label: string;
  }>({
    latitude: PANGKALPINANG_CENTER.latitude,
    longitude: PANGKALPINANG_CENTER.longitude,
    label: 'Pusat Kota Pangkalpinang (Bawaan)',
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState('');

  const handleUseMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setGeoError(
        'Peramban Anda tidak mendukung fitur geolokasi. Pilih titik acuan di bawah.'
      );
      return;
    }

    setGeoLoading(true);
    setGeoError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          label: 'Lokasi GPS Anda Saat Ini',
        });
        setGeoLoading(false);
      },
      (err) => {
        setGeoLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError(
            'Izin lokasi ditolak oleh peramban. Anda dapat memilih salah satu titik acuan Pangkalpinang di bawah ini.'
          );
        } else {
          setGeoError(
            'Lokasi GPS tidak dapat diakses saat ini. Gunakan titik acuan kota untuk menghitung jarak.'
          );
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const sortedRestaurants = useMemo(() => {
    return sortRestaurantsByDistance(
      restaurants,
      origin.latitude,
      origin.longitude
    );
  }, [restaurants, origin]);

  return (
    <section
      aria-label="Restoran Terdekat"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header & Kontrol Geolokasi */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-red-600">
              Restoran · Pencarian Berbasis Jarak
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
              Restoran Cepat Saji Terdekat
            </h1>
            <p className="mt-1.5 text-sm text-zinc-600">
              Urutkan gerai dari jarak paling dekat dengan titik lokasi Anda
              saat ini di Kota Pangkalpinang.
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={geoLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Crosshair className="h-4 w-4" />
            <span>
              {geoLoading ? 'Mendeteksi Lokasi...' : 'Gunakan Lokasi Saya'}
            </span>
          </button>
        </div>

        {/* Titik Acuan Aktif & Pilihan Cepat */}
        <div className="mt-5 flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-zinc-600">
            <span className="font-semibold text-zinc-900">
              Titik Acuan Aktif:
            </span>{' '}
            <span>{origin.label}</span>{' '}
            <span className="font-mono-tabular text-zinc-400">
              ({origin.latitude.toFixed(4)}, {origin.longitude.toFixed(4)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {PRESET_LOCATIONS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setGeoError('');
                  setOrigin({
                    latitude: preset.latitude,
                    longitude: preset.longitude,
                    label: preset.label,
                  });
                }}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                  origin.label === preset.label
                    ? 'bg-zinc-900 text-white'
                    : 'border border-zinc-200 bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {geoError && (
          <div
            role="status"
            className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-medium text-amber-900"
          >
            {geoError}
          </div>
        )}
      </div>

      {/* Daftar Restoran Terurut */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
            Menghitung jarak restoran terdekat...
          </div>
        ) : sortedRestaurants.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-500">
            Belum ada data restoran yang tersedia.
          </div>
        ) : (
          sortedRestaurants.map((r, index) => (
            <article
              key={r.restaurant_id}
              className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 font-mono-tabular text-sm font-bold text-zinc-800">
                  {String(index + 1).padStart(2, '0')}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                    <span className="font-medium text-zinc-700">
                      {detectRestaurantBrand(r.name)}
                    </span>
                    <span aria-hidden="true" className="text-zinc-300">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1 font-semibold text-zinc-900 tabular-nums">
                      <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      {r.avg_rating > 0
                        ? r.avg_rating.toFixed(1).replace('.', ',')
                        : 'Baru'}{' '}
                      ({r.review_count})
                    </span>
                    <span aria-hidden="true" className="text-zinc-300">
                      ·
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      {r.operating_hours}
                    </span>
                  </div>

                  <h2 className="mt-1 font-display text-lg font-bold text-zinc-950">
                    {r.name}
                  </h2>

                  <p className="mt-1 flex items-start gap-1.5 text-sm text-zinc-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                    <span>{r.address}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:items-end gap-3 shrink-0 border-t border-zinc-100 pt-3 sm:border-t-0 sm:pt-0">
                <div className="flex items-baseline gap-2 sm:justify-end">
                  <span className="text-xs text-zinc-500">Estimasi jarak</span>
                  <span className="font-display text-lg font-bold tracking-tight text-red-600 tabular-nums">
                    {formatDistanceId(r.distanceKm)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSelectRestaurant(r.restaurant_id)}
                    className="rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Lihat Menu &amp; Ulasan
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewOnMap(r.restaurant_id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    <span>Lihat di Peta</span>
                  </button>
                  <a
                    href={getGoogleMapsDirectionsUrl(r.latitude, r.longitude)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors whitespace-nowrap"
                  >
                    <span>Petunjuk Arah</span>
                    <ExternalLink className="h-3 w-3 text-zinc-400" />
                  </a>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
