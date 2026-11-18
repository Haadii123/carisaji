import { useCallback, useEffect, useState } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthModal } from './components/AuthModal';
import { MapView } from './components/MapView';
import { Navbar } from './components/Navbar';
import { NearestRestaurants } from './components/NearestRestaurants';
import { RestaurantDetailModal } from './components/RestaurantDetailModal';
import { RestaurantList } from './components/RestaurantList';
import {
  api,
  clearAuthSession,
  getStoredToken,
  getStoredUser,
  saveAuthSession,
} from './services/api';
import type { ActivePage, Restaurant, User } from './types';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('peta');
  const [user, setUser] = useState<User | null>(() => getStoredUser());
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
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>(
    'login'
  );
  const [toastMessage, setToastMessage] = useState('');

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

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    api
      .getMe()
      .then((res) => {
        setUser(res.user);
      })
      .catch(() => {
        clearAuthSession();
        setUser(null);
      });
  }, []);

  const handleNavigate = (page: ActivePage) => {
    if (page === 'admin' && user?.role !== 'admin') {
      setAuthModalMode('login');
      setAuthModalOpen(true);
      showToast('Masuk sebagai Pengelola Data untuk membuka Kelola Data.');
      return;
    }
    setActivePage(page);
  };

  const handleAuthSuccess = (
    token: string,
    loggedInUser: User,
    message: string
  ) => {
    saveAuthSession(token, loggedInUser);
    setUser(loggedInUser);
    setAuthModalOpen(false);
    showToast(message);
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    if (activePage === 'admin') {
      setActivePage('peta');
    }
    showToast('Anda telah keluar dari akun CARISAJI.');
  };

  const handleViewOnMap = (restaurantId: number) => {
    setFocusedMapRestaurantId(restaurantId);
    setActivePage('peta');
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
      <Navbar
        activePage={activePage}
        onNavigate={handleNavigate}
        user={user}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
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

      {/* Modal Detail Menu & Ulasan */}
      <RestaurantDetailModal
        restaurantId={selectedRestaurantId}
        user={user}
        onClose={() => setSelectedRestaurantId(null)}
        onRequireLogin={() => {
          setSelectedRestaurantId(null);
          setAuthModalMode('login');
          setAuthModalOpen(true);
        }}
        onReviewSubmitted={fetchRestaurants}
      />

      {/* Modal Masuk / Daftar */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
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
