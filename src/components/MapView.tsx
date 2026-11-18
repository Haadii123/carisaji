import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Clock, ExternalLink, MapPin, Navigation, Search, Star } from 'lucide-react';
import type { BrandFilter, Restaurant } from '../types';
import { BRAND_OPTIONS, detectRestaurantBrand } from '../utils/format';
import {
  getGoogleMapsDirectionsUrl,
  PANGKALPINANG_CENTER,
} from '../utils/geo';

interface MapViewProps {
  restaurants: Restaurant[];
  loading: boolean;
  focusedRestaurantId: number | null;
  onFocusHandled: () => void;
  onSelectRestaurant: (id: number) => void;
}

function createPinIcon(isActive: boolean) {
  const fill = isActive ? '#991B1B' : '#DC2626';
  const ring = isActive ? '#FCA5A5' : '#FFFFFF';
  const size = isActive ? 38 : 32;

  return L.divIcon({
    className: 'carisaji-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
    html: `<svg width="${size}" height="${size}" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M18 2C11.3726 2 6 7.37258 6 14C6 22.5 18 34 18 34C18 34 30 22.5 30 14C30 7.37258 24.6274 2 18 2Z" fill="${fill}" stroke="${ring}" stroke-width="2.5"/>
      <circle cx="18" cy="14" r="4.5" fill="#FFFFFF"/>
    </svg>`,
  });
}

function MapController({
  target,
  onDone,
}: {
  target: { latitude: number; longitude: number } | null;
  onDone: () => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.latitude, target.longitude], 15, { duration: 0.6 });
    onDone();
  }, [target, map, onDone]);

  return null;
}

export function MapView({
  restaurants,
  loading,
  focusedRestaurantId,
  onFocusHandled,
  onSelectRestaurant,
}: MapViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<BrandFilter>('Semua');
  const [activeId, setActiveId] = useState<number | null>(focusedRestaurantId);
  const [flyTarget, setFlyTarget] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const markerRefs = useRef<Record<number, L.Marker | null>>({});

  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      const matchesBrand =
        selectedBrand === 'Semua' ||
        detectRestaurantBrand(r.name) === selectedBrand;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.address.toLowerCase().includes(q);
      return matchesBrand && matchesQuery;
    });
  }, [restaurants, selectedBrand, searchQuery]);

  useEffect(() => {
    if (!focusedRestaurantId) return;
    const found = restaurants.find(
      (r) => r.restaurant_id === focusedRestaurantId
    );
    if (found) {
      setActiveId(found.restaurant_id);
      setFlyTarget({ latitude: found.latitude, longitude: found.longitude });
      setTimeout(() => {
        markerRefs.current[found.restaurant_id]?.openPopup();
      }, 350);
    }
    onFocusHandled();
  }, [focusedRestaurantId, restaurants, onFocusHandled]);

  const handleSidebarSelect = (r: Restaurant) => {
    setActiveId(r.restaurant_id);
    setFlyTarget({ latitude: r.latitude, longitude: r.longitude });
    markerRefs.current[r.restaurant_id]?.openPopup();
  };

  return (
    <section aria-label="Peta Interaktif Restoran Cepat Saji Pangkalpinang">
      {/* Header Bagian Peta */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold tracking-wide text-red-600">
              Kota Pangkalpinang · OpenStreetMap
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl text-balance">
              Peta Persebaran Restoran Cepat Saji
            </h1>
            <p className="mt-1.5 text-sm text-zinc-600">
              Klik penanda lokasi di peta atau pilih gerai dari daftar untuk
              melihat daftar menu, ulasan pelanggan, dan petunjuk arah.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-600 tabular-nums shrink-0">
            <span>
              <strong className="font-semibold text-zinc-950">
                {restaurants.length}
              </strong>{' '}
              gerai terdata
            </span>
            <span aria-hidden="true" className="text-zinc-300">
              ·
            </span>
            <span>
              <strong className="font-semibold text-zinc-950">7</strong> merek
              waralaba
            </span>
          </div>
        </div>
      </div>

      {/* Kanvas Split: Panel Daftar Kiri + Peta Kanan */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr] items-stretch">
          {/* Sidebar Pencarian & Daftar Ringkas */}
          <aside className="flex flex-col rounded-2xl border border-zinc-200 bg-white overflow-hidden lg:h-[620px]">
            <div className="border-b border-zinc-200 p-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <label htmlFor="map-search" className="sr-only">
                  Cari restoran di peta
                </label>
                <input
                  id="map-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama gerai atau jalan..."
                  className="w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="map-brand-filter" className="sr-only">
                  Filter merek restoran
                </label>
                <select
                  id="map-brand-filter"
                  value={selectedBrand}
                  onChange={(e) =>
                    setSelectedBrand(e.target.value as BrandFilter)
                  }
                  className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs font-medium text-zinc-800 focus:border-red-600 focus:outline-none"
                >
                  {BRAND_OPTIONS.map((brand) => (
                    <option key={brand} value={brand}>
                      {brand === 'Semua' ? 'Semua Merek Restoran' : brand}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 max-h-[320px] lg:max-h-none">
              {loading ? (
                <div className="p-6 text-center text-sm text-zinc-500">
                  Memuat titik lokasi restoran...
                </div>
              ) : filteredRestaurants.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-sm font-medium text-zinc-700">
                    Tidak ada restoran yang cocok.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedBrand('Semua');
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
                  >
                    Tampilkan semua gerai
                  </button>
                </div>
              ) : (
                filteredRestaurants.map((r) => {
                  const isActive = activeId === r.restaurant_id;
                  return (
                    <button
                      key={r.restaurant_id}
                      type="button"
                      onClick={() => handleSidebarSelect(r)}
                      className={`w-full px-4 py-3.5 text-left transition-colors cursor-pointer ${
                        isActive ? 'bg-red-50/70' : 'hover:bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-zinc-950 leading-snug">
                          {r.name}
                        </p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-800 tabular-nums shrink-0">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                          {r.avg_rating > 0
                            ? r.avg_rating.toFixed(1).replace('.', ',')
                            : 'Baru'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500 line-clamp-1">
                        {r.address}
                      </p>
                      <p className="mt-1.5 text-xs text-zinc-500">
                        {detectRestaurantBrand(r.name)} · {r.operating_hours}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Peta Leaflet OpenStreetMap */}
          <div
            data-testid="carisaji-map-container"
            className="relative h-[460px] lg:h-[620px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100"
          >
            <MapContainer
              center={[
                PANGKALPINANG_CENTER.latitude,
                PANGKALPINANG_CENTER.longitude,
              ]}
              zoom={13}
              scrollWheelZoom={true}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapController
                target={flyTarget}
                onDone={() => setFlyTarget(null)}
              />

              {filteredRestaurants.map((r) => (
                <Marker
                  key={r.restaurant_id}
                  position={[r.latitude, r.longitude]}
                  icon={createPinIcon(activeId === r.restaurant_id)}
                  ref={(ref) => {
                    markerRefs.current[r.restaurant_id] = ref;
                  }}
                  eventHandlers={{
                    click: () => setActiveId(r.restaurant_id),
                  }}
                >
                  <Popup className="carisaji-popup">
                    <div className="p-4 space-y-3 bg-white">
                      <div>
                        <p className="text-xs font-medium text-zinc-500">
                          {detectRestaurantBrand(r.name)}
                        </p>
                        <h3 className="mt-0.5 font-display text-sm font-bold text-zinc-950 leading-snug">
                          {r.name}
                        </h3>
                      </div>

                      <div className="space-y-1.5 text-xs text-zinc-600">
                        <p className="flex items-start gap-1.5 leading-relaxed">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span>{r.address}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          <span>{r.operating_hours}</span>
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
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => onSelectRestaurant(r.restaurant_id)}
                          className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors whitespace-nowrap cursor-pointer"
                        >
                          Lihat Menu &amp; Ulasan
                        </button>
                        <a
                          href={getGoogleMapsDirectionsUrl(
                            r.latitude,
                            r.longitude
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Petunjuk arah ke ${r.name}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          <span>Arah</span>
                          <ExternalLink className="h-3 w-3 text-zinc-400" />
                        </a>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
