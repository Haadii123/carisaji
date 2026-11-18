import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { api } from '../services/api';
import type { MenuItem, Restaurant } from '../types';
import { formatRupiah } from '../utils/format';

interface AdminDashboardProps {
  restaurants: Restaurant[];
  onDataChanged: () => void;
  onNotify: (message: string) => void;
}

type AdminTab = 'restoran' | 'menu';

export function AdminDashboard({
  restaurants,
  onDataChanged,
  onNotify,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('restoran');

  // Form Restoran (Tambah / Edit)
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [operatingHours, setOperatingHours] = useState('10:00 - 22:00');
  const [latitude, setLatitude] = useState('-2.1292');
  const [longitude, setLongitude] = useState('106.1107');
  const [savingRestaurant, setSavingRestaurant] = useState(false);
  const [restaurantError, setRestaurantError] = useState('');

  // Konfirmasi Hapus Restoran
  const [confirmDeleteRest, setConfirmDeleteRest] = useState<Restaurant | null>(
    null
  );
  const [deletingRest, setDeletingRest] = useState(false);

  // Kelola Menu
  const [selectedRestId, setSelectedRestId] = useState<number>(
    restaurants[0]?.restaurant_id || 0
  );
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [menusLoading, setMenusLoading] = useState(false);
  const [menuItemName, setMenuItemName] = useState('');
  const [menuCategory, setMenuCategory] = useState('Paket Kombo');
  const [menuPrice, setMenuPrice] = useState('');
  const [savingMenu, setSavingMenu] = useState(false);
  const [menuError, setMenuError] = useState('');

  useEffect(() => {
    if (
      restaurants.length > 0 &&
      !restaurants.some((r) => r.restaurant_id === selectedRestId)
    ) {
      setSelectedRestId(restaurants[0].restaurant_id);
    }
  }, [restaurants, selectedRestId]);

  const loadMenus = async (restaurantId: number) => {
    if (!restaurantId) {
      setMenus([]);
      return;
    }
    setMenusLoading(true);
    try {
      const res = await api.getMenusByRestaurant(restaurantId);
      setMenus(res.menus);
    } catch {
      setMenus([]);
    } finally {
      setMenusLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'menu' && selectedRestId) {
      loadMenus(selectedRestId);
    }
  }, [activeTab, selectedRestId]);

  const openAddRestaurant = () => {
    setEditingId(null);
    setName('');
    setAddress('');
    setOperatingHours('10:00 - 22:00');
    setLatitude('-2.1292');
    setLongitude('106.1107');
    setRestaurantError('');
    setFormOpen(true);
  };

  const openEditRestaurant = (r: Restaurant) => {
    setEditingId(r.restaurant_id);
    setName(r.name);
    setAddress(r.address);
    setOperatingHours(r.operating_hours);
    setLatitude(String(r.latitude));
    setLongitude(String(r.longitude));
    setRestaurantError('');
    setFormOpen(true);
  };

  const handleSaveRestaurant = async (e: FormEvent) => {
    e.preventDefault();
    setRestaurantError('');

    const lat = Number(latitude);
    const lng = Number(longitude);
    if (!name.trim() || !address.trim()) {
      setRestaurantError('Nama restoran dan alamat wajib diisi.');
      return;
    }
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      setRestaurantError(
        'Koordinat Latitude (-90 s.d. 90) dan Longitude (-180 s.d. 180) harus berupa angka valid.'
      );
      return;
    }

    setSavingRestaurant(true);
    try {
      if (editingId) {
        const res = await api.updateRestaurant(editingId, {
          name: name.trim(),
          address: address.trim(),
          operating_hours: operatingHours.trim() || '10:00 - 22:00',
          latitude: lat,
          longitude: lng,
        });
        onNotify(res.message);
      } else {
        const res = await api.createRestaurant({
          name: name.trim(),
          address: address.trim(),
          operating_hours: operatingHours.trim() || '10:00 - 22:00',
          latitude: lat,
          longitude: lng,
        });
        onNotify(res.message);
      }
      setFormOpen(false);
      onDataChanged();
    } catch (err) {
      setRestaurantError(
        err instanceof Error ? err.message : 'Gagal menyimpan data restoran.'
      );
    } finally {
      setSavingRestaurant(false);
    }
  };

  const handleConfirmDeleteRestaurant = async () => {
    if (!confirmDeleteRest) return;
    setDeletingRest(true);
    try {
      const res = await api.deleteRestaurant(confirmDeleteRest.restaurant_id);
      setConfirmDeleteRest(null);
      onNotify(res.message);
      onDataChanged();
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : 'Gagal menghapus restoran.'
      );
    } finally {
      setDeletingRest(false);
    }
  };

  const handleAddMenu = async (e: FormEvent) => {
    e.preventDefault();
    setMenuError('');
    const priceNum = Number(menuPrice);

    if (!selectedRestId) {
      setMenuError('Pilih restoran terlebih dahulu.');
      return;
    }
    if (!menuItemName.trim()) {
      setMenuError('Nama menu wajib diisi.');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setMenuError('Harga menu harus lebih dari Rp 0.');
      return;
    }

    setSavingMenu(true);
    try {
      const res = await api.createMenu({
        restaurant_id: selectedRestId,
        item_name: menuItemName.trim(),
        category: menuCategory.trim() || 'Paket Kombo',
        price: priceNum,
      });
      setMenuItemName('');
      setMenuPrice('');
      onNotify(res.message);
      await loadMenus(selectedRestId);
      onDataChanged();
    } catch (err) {
      setMenuError(
        err instanceof Error ? err.message : 'Gagal menambahkan menu.'
      );
    } finally {
      setSavingMenu(false);
    }
  };

  const handleDeleteMenu = async (menuId: number) => {
    try {
      const res = await api.deleteMenu(menuId);
      onNotify(res.message);
      await loadMenus(selectedRestId);
      onDataChanged();
    } catch (err) {
      onNotify(err instanceof Error ? err.message : 'Gagal menghapus menu.');
    }
  };

  const totalMenus = restaurants.reduce(
    (sum, r) => sum + (r.menu_count || 0),
    0
  );
  const avgCityRating =
    restaurants.length > 0
      ? (
          restaurants.reduce((sum, r) => sum + r.avg_rating, 0) /
          restaurants.length
        )
          .toFixed(1)
          .replace('.', ',')
      : '0,0';

  return (
    <section
      aria-label="Dasbor Pengelola Data"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      {/* Header & Ringkasan Metrik */}
      <div className="flex flex-col gap-5 border-b border-zinc-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-red-600">
            Dasbor Admin · Pengelola Data
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Kelola Data Restoran &amp; Menu
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600">
            Tambahkan gerai baru beserta titik koordinat spasial, perbarui jam
            operasional, atau kelola daftar menu setiap restoran.
          </p>
        </div>

        <div className="grid grid-cols-3 divide-x divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
          <div className="px-4 py-3">
            <p className="text-xs text-zinc-500">Total Restoran</p>
            <p className="mt-0.5 font-mono-tabular text-lg font-bold text-zinc-950">
              {restaurants.length}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-zinc-500">Total Item Menu</p>
            <p className="mt-0.5 font-mono-tabular text-lg font-bold text-zinc-950">
              {totalMenus}
            </p>
          </div>
          <div className="px-4 py-3">
            <p className="text-xs text-zinc-500">Rata Rating</p>
            <p className="mt-0.5 font-mono-tabular text-lg font-bold text-zinc-950">
              {avgCityRating}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Kontrol */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-xl bg-zinc-200/70 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('restoran')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'restoran'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Data Restoran
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'menu'
                ? 'bg-white text-zinc-950 shadow-xs'
                : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Kelola Menu Restoran
          </button>
        </div>

        {activeTab === 'restoran' && (
          <button
            type="button"
            onClick={openAddRestaurant}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Restoran</span>
          </button>
        )}
      </div>

      {/* TAB 1: DATA RESTORAN */}
      {activeTab === 'restoran' && (
        <div className="mt-5 space-y-5">
          {formOpen && (
            <form
              onSubmit={handleSaveRestaurant}
              className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-bold text-zinc-950">
                  {editingId ? 'Edit Data Restoran' : 'Tambah Restoran Baru'}
                </h2>
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 cursor-pointer"
                >
                  Batal
                </button>
              </div>

              {restaurantError && (
                <div
                  role="alert"
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-medium text-red-800"
                >
                  {restaurantError}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="rest-name"
                    className="block text-xs font-semibold text-zinc-700"
                  >
                    Nama Restoran
                  </label>
                  <input
                    id="rest-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: KFC Transmart Pangkalpinang"
                    className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="rest-hours"
                    className="block text-xs font-semibold text-zinc-700"
                  >
                    Jam Operasional
                  </label>
                  <input
                    id="rest-hours"
                    type="text"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(e.target.value)}
                    placeholder="Contoh: 10:00 - 22:00 atau 24 Jam"
                    className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    htmlFor="rest-address"
                    className="block text-xs font-semibold text-zinc-700"
                  >
                    Alamat Lengkap
                  </label>
                  <input
                    id="rest-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Jl. Jendral Sudirman, Kota Pangkalpinang..."
                    className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3.5 py-2 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="rest-lat"
                    className="block text-xs font-semibold text-zinc-700"
                  >
                    Latitude (Garis Lintang)
                  </label>
                  <input
                    id="rest-lat"
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-2.1292"
                    className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3.5 py-2 font-mono-tabular text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="rest-lng"
                    className="block text-xs font-semibold text-zinc-700"
                  >
                    Longitude (Garis Bujur)
                  </label>
                  <input
                    id="rest-lng"
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="106.1107"
                    className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3.5 py-2 font-mono-tabular text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingRestaurant}
                  className="rounded-lg bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 cursor-pointer"
                >
                  {savingRestaurant
                    ? 'Menyimpan...'
                    : editingId
                    ? 'Simpan Perubahan'
                    : 'Simpan Restoran'}
                </button>
              </div>
            </form>
          )}

          {/* Tabel Restoran */}
          <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                  <th className="px-4 py-3">Restoran &amp; Alamat</th>
                  <th className="px-4 py-3 whitespace-nowrap">Jam Buka</th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    Koordinat (Lat, Lng)
                  </th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    Menu
                  </th>
                  <th className="px-4 py-3 text-right whitespace-nowrap">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {restaurants.map((r) => (
                  <tr key={r.restaurant_id} className="hover:bg-zinc-50/70">
                    <td className="px-4 py-3.5 max-w-md">
                      <p className="font-semibold text-zinc-950">{r.name}</p>
                      <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">
                        {r.address}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-700 whitespace-nowrap">
                      {r.operating_hours}
                    </td>
                    <td className="px-4 py-3.5 font-mono-tabular text-xs text-zinc-600 whitespace-nowrap">
                      {r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono-tabular text-xs font-semibold text-zinc-800 whitespace-nowrap">
                      {r.menu_count ?? 0}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRestId(r.restaurant_id);
                            setActiveTab('menu');
                          }}
                          aria-label={`Kelola menu ${r.name}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                        >
                          <UtensilsCrossed className="h-3.5 w-3.5" />
                          <span>Menu</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditRestaurant(r)}
                          aria-label={`Edit ${r.name}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteRest(r)}
                          aria-label={`Hapus ${r.name}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: KELOLA MENU */}
      {activeTab === 'menu' && (
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] items-start">
          {/* Form Tambah Menu */}
          <form
            onSubmit={handleAddMenu}
            className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4"
          >
            <h2 className="font-display text-base font-bold text-zinc-950">
              Tambah Item Menu
            </h2>

            <div>
              <label
                htmlFor="menu-rest-select"
                className="block text-xs font-semibold text-zinc-700"
              >
                Pilih Restoran
              </label>
              <select
                id="menu-rest-select"
                value={selectedRestId}
                onChange={(e) => setSelectedRestId(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
              >
                {restaurants.map((r) => (
                  <option key={r.restaurant_id} value={r.restaurant_id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="menu-item-name"
                className="block text-xs font-semibold text-zinc-700"
              >
                Nama Menu
              </label>
              <input
                id="menu-item-name"
                type="text"
                value={menuItemName}
                onChange={(e) => setMenuItemName(e.target.value)}
                placeholder="Contoh: Paket Kombo Hemat 1"
                className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label
                htmlFor="menu-category"
                className="block text-xs font-semibold text-zinc-700"
              >
                Kategori Menu
              </label>
              <input
                id="menu-category"
                type="text"
                value={menuCategory}
                onChange={(e) => setMenuCategory(e.target.value)}
                placeholder="Contoh: Paket Kombo, Burger, Minuman"
                className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="menu-price"
                className="block text-xs font-semibold text-zinc-700"
              >
                Harga (Rp)
              </label>
              <input
                id="menu-price"
                type="number"
                min="100"
                step="500"
                value={menuPrice}
                onChange={(e) => setMenuPrice(e.target.value)}
                placeholder="Contoh: 35000"
                className="mt-1.5 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono-tabular text-sm text-zinc-900 focus:border-red-600 focus:outline-none"
                required
              />
            </div>

            {menuError && (
              <p className="text-xs font-medium text-red-600">{menuError}</p>
            )}

            <button
              type="submit"
              disabled={savingMenu}
              className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {savingMenu ? 'Menambahkan...' : 'Tambah ke Daftar Menu'}
            </button>
          </form>

          {/* Tabel Daftar Menu Restoran Terpilih */}
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
              <div>
                <h3 className="font-display text-base font-bold text-zinc-950">
                  {restaurants.find((r) => r.restaurant_id === selectedRestId)
                    ?.name || 'Daftar Menu'}
                </h3>
                <p className="text-xs text-zinc-500 tabular-nums">
                  {menus.length} item menu terdaftar
                </p>
              </div>
            </div>

            {menusLoading ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                Memuat daftar menu...
              </div>
            ) : menus.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                Belum ada item menu untuk restoran ini. Tambahkan melalui
                formulir di samping.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
                      <th className="px-4 py-3">Nama Menu</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3 text-right">Harga</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {menus.map((m) => (
                      <tr key={m.menu_id} className="hover:bg-zinc-50/70">
                        <td className="px-4 py-3 font-medium text-zinc-900">
                          {m.item_name}
                        </td>
                        <td className="px-4 py-3 text-xs text-zinc-500">
                          {m.category}
                        </td>
                        <td className="px-4 py-3 text-right font-mono-tabular text-xs font-semibold text-zinc-900 whitespace-nowrap">
                          {formatRupiah(m.price)}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDeleteMenu(m.menu_id)}
                            aria-label={`Hapus menu ${m.item_name}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Restoran */}
      {confirmDeleteRest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmDeleteRest(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
          >
            <h3
              id="delete-confirm-title"
              className="font-display text-lg font-bold text-zinc-950"
            >
              Hapus Restoran?
            </h3>
            <p className="mt-2 text-sm text-zinc-600">
              Anda yakin ingin menghapus{' '}
              <strong className="text-zinc-900">
                {confirmDeleteRest.name}
              </strong>
              ? Seluruh menu dan ulasan pada gerai ini juga akan ikut terhapus.
            </p>
            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteRest(null)}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingRest}
                onClick={handleConfirmDeleteRestaurant}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {deletingRest ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
