import { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { MapView } from './components/MapView';
import { Navbar } from './components/Navbar';
import { NearestRestaurants } from './components/NearestRestaurants';
import { OrdersPage } from './components/OrdersPage';
import { PaymentInstructionModal } from './components/PaymentInstructionModal';
import { RestaurantDetailModal } from './components/RestaurantDetailModal';
import { RestaurantList } from './components/RestaurantList';
import { api, getAuthToken, setAuthToken } from './services/api';
import type { ActivePage, Order, Restaurant, User } from './types';
import { loadFavoriteIds, saveFavoriteIds } from './utils/favorites';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('peta');
  const [user, setUser] = useState<User | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [selectedRestaurantId, setSelectedRestaurantId] = useState<
    number | null
  >(null);
  const [focusedMapRestaurantId, setFocusedMapRestaurantId] = useState<
    number | null
  >(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [toastMessage, setToastMessage] = useState('');

  // Fitur modular: Restoran Favorit & Pesanan
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() =>
    loadFavoriteIds()
  );
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [activePaymentOrder, setActivePaymentOrder] = useState<Order | null>(
    null
  );

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const fetchRestaurants = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.getRestaurants();
      setRestaurants(res.restaurants);
    } catch (err) {
      setLoadError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat data restoran dari server.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyOrders = useCallback(async () => {
    if (!getAuthToken()) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    setOrdersError('');
    try {
      const res = await api.getMyOrders();
      setOrders(res.orders);
    } catch (err) {
      setOrdersError(
        err instanceof Error
          ? err.message
          : 'Gagal memuat daftar pesanan Anda.'
      );
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    if (activePage === 'pesanan' && user) {
      fetchMyOrders();
    }
  }, [activePage, user, fetchMyOrders]);

  const handleToggleFavorite = (restaurantId: number) => {
    setFavoriteIds((prev) => {
      const exists = prev.includes(restaurantId);
      const next = exists
        ? prev.filter((id) => id !== restaurantId)
        : [...prev, restaurantId];
      saveFavoriteIds(next);
      showToast(
        exists
          ? 'Restoran dihapus dari daftar favorit.'
          : 'Restoran disimpan ke daftar favorit.'
      );
      return next;
    });
  };

  const handleNavigate = (page: ActivePage) => {
    if (page === 'admin' && user?.role !== 'admin') {
      setAuthMode('login');
      setAuthModalOpen(true);
      showToast('Masuk sebagai Pengelola Data untuk membuka Kelola Data.');
      return;
    }
    if (page === 'pesanan' && !user) {
      setAuthMode('login');
      setAuthModalOpen(true);
      showToast('Silakan masuk terlebih dahulu untuk melihat pesanan Anda.');
      return;
    }
    setActivePage(page);
  };

  const handleAuthSuccess = (
    token: string,
    loggedInUser: User,
    message: string
  ) => {
    setAuthToken(token);
    setUser(loggedInUser);
    setAuthModalOpen(false);
    showToast(message);
    fetchMyOrders();
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUser(null);
    setOrders([]);
    setActivePaymentOrder(null);
    if (activePage === 'admin' || activePage === 'pesanan') {
      setActivePage('peta');
    }
    showToast('Anda telah keluar dari akun CARISAJI.');
  };

  const handleViewOnMap = (restaurantId: number) => {
    setFocusedMapRestaurantId(restaurantId);
    setActivePage('peta');
  };

  const handleOrderCreated = (order: Order) => {
    setSelectedRestaurantId(null);
    setActivePaymentOrder(order);
    setOrders((prev) => [order, ...prev]);
    fetchRestaurants();
    showToast(`Pesanan ${order.order_code} berhasil dibuat.`);
  };

  const handleOrderUpdated = (updatedOrder: Order, message: string) => {
    setActivePaymentOrder(updatedOrder);
    setOrders((prev) =>
      prev.map((o) => (o.order_id === updatedOrder.order_id ? updatedOrder : o))
    );
    fetchRestaurants();
    showToast(message);
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuth={(mode) => {
          setAuthMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {activePage === 'peta' && (
          <MapView
            restaurants={restaurants}
            loading={loading}
            focusedRestaurantId={focusedMapRestaurantId}
            onFocusHandled={() => setFocusedMapRestaurantId(null)}
            onSelectRestaurant={(id) => setSelectedRestaurantId(id)}
          />
        )}

        {activePage === 'daftar' && (
          <RestaurantList
            restaurants={restaurants}
            loading={loading}
            error={loadError}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            onRetry={fetchRestaurants}
            onSelectRestaurant={(id) => setSelectedRestaurantId(id)}
          />
        )}

        {activePage === 'terdekat' && (
          <NearestRestaurants
            restaurants={restaurants}
            loading={loading}
            onSelectRestaurant={(id) => setSelectedRestaurantId(id)}
            onViewOnMap={handleViewOnMap}
          />
        )}

        {activePage === 'pesanan' && user && (
          <OrdersPage
            orders={orders}
            loading={ordersLoading}
            error={ordersError}
            onRefresh={fetchMyOrders}
            onPayOrder={(order) => setActivePaymentOrder(order)}
            onExploreRestaurants={() => setActivePage('daftar')}
          />
        )}

        {activePage === 'admin' && user?.role === 'admin' && (
          <AdminDashboard
            restaurants={restaurants}
            onDataChanged={fetchRestaurants}
            onNotify={showToast}
          />
        )}
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-2 px-4 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <p>
            <strong className="font-semibold text-zinc-900">CARISAJI</strong> ·
            Direktori Geospasial Restoran Cepat Saji Kota Pangkalpinang
          </p>
          <p>Data peta oleh OpenStreetMap · Kepulauan Bangka Belitung</p>
        </div>
      </footer>

      {/* Modal Detail Menu, ETA & Ulasan */}
      <RestaurantDetailModal
        restaurantId={selectedRestaurantId}
        user={user}
        isFavorite={
          selectedRestaurantId !== null &&
          favoriteIds.includes(selectedRestaurantId)
        }
        onToggleFavorite={handleToggleFavorite}
        onClose={() => setSelectedRestaurantId(null)}
        onRequireLogin={() => {
          setSelectedRestaurantId(null);
          setAuthMode('login');
          setAuthModalOpen(true);
        }}
        onReviewSubmitted={fetchRestaurants}
        onOrderCreated={handleOrderCreated}
      />

      {/* Modal Instruksi Pembayaran QRIS / Virtual Account */}
      <PaymentInstructionModal
        order={activePaymentOrder}
        onClose={() => setActivePaymentOrder(null)}
        onOrderUpdated={handleOrderUpdated}
        onOpenMyOrders={() => setActivePage('pesanan')}
      />

      {/* Modal Masuk & Daftar */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Notifikasi Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-medium text-white shadow-lg"
        >
          <span>{toastMessage}</span>
          <button
            type="button"
            aria-label="Tutup notifikasi"
            onClick={() => setToastMessage('')}
            className="text-zinc-400 hover:text-white cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
