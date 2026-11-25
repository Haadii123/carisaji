import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import type { ActivePage, User } from '../types';

interface NavbarProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  user: User | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onLogout: () => void;
}

export function Navbar({
  activePage,
  onNavigate,
  user,
  onOpenAuth,
  onLogout,
}: NavbarProps) {
  const [restoranMenuOpen, setRestoranMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setRestoranMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setRestoranMenuOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const isRestoranActive = activePage === 'daftar' || activePage === 'terdekat';

  const handleSelectPage = (page: ActivePage) => {
    onNavigate(page);
    setRestoranMenuOpen(false);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 lg:px-8">
        {/* Zona 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleSelectPage('peta')}
          className="font-display text-xl font-extrabold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 cursor-pointer hover:text-red-600 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600"
        >
          CARISAJI
        </button>

        {/* Zona 2: Navigasi Utama (Desktop) */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-7 text-sm font-medium"
        >
          <button
            type="button"
            onClick={() => handleSelectPage('peta')}
            className={`py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors border-b-2 ${
              activePage === 'peta'
                ? 'border-red-600 text-zinc-950 font-semibold'
                : 'border-transparent text-zinc-600 hover:text-zinc-950'
            }`}
          >
            Peta
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              aria-expanded={restoranMenuOpen}
              aria-haspopup="menu"
              onClick={() => setRestoranMenuOpen((prev) => !prev)}
              className={`inline-flex items-center gap-1.5 py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors border-b-2 ${
                isRestoranActive
                  ? 'border-red-600 text-zinc-950 font-semibold'
                  : 'border-transparent text-zinc-600 hover:text-zinc-950'
              }`}
            >
              <span>Restoran</span>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-150 ${
                  restoranMenuOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {restoranMenuOpen && (
              <div
                role="menu"
                aria-label="Submenu Restoran"
                className="absolute left-0 top-full mt-2 w-56 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectPage('daftar')}
                  className={`flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    activePage === 'daftar'
                      ? 'bg-red-50 text-red-700'
                      : 'text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  <span className="text-sm font-semibold">Daftar Restoran</span>
                  <span className="text-xs text-zinc-500">
                    Cari gerai & filter merek
                  </span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => handleSelectPage('terdekat')}
                  className={`flex w-full flex-col items-start rounded-lg px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    activePage === 'terdekat'
                      ? 'bg-red-50 text-red-700'
                      : 'text-zinc-800 hover:bg-zinc-50'
                  }`}
                >
                  <span className="text-sm font-semibold">
                    Restoran Terdekat
                  </span>
                  <span className="text-xs text-zinc-500">
                    Urutkan dari lokasi Anda
                  </span>
                </button>
              </div>
            )}
          </div>

          {user && (
            <button
              type="button"
              onClick={() => handleSelectPage('pesanan')}
              className={`py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors border-b-2 ${
                activePage === 'pesanan'
                  ? 'border-red-600 text-zinc-950 font-semibold'
                  : 'border-transparent text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Pesanan Saya
            </button>
          )}

          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleSelectPage('admin')}
              className={`py-1 whitespace-nowrap shrink-0 cursor-pointer transition-colors border-b-2 ${
                activePage === 'admin'
                  ? 'border-red-600 text-zinc-950 font-semibold'
                  : 'border-transparent text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Kelola Data
            </button>
          )}
        </nav>

        {/* Zona 3: Aksi Utama */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-zinc-900 leading-tight max-w-[160px] truncate">
                  {user.full_name}
                </p>
                <p className="text-xs text-zinc-500 leading-tight">
                  {user.role === 'admin' ? 'Pengelola Data' : 'Pencari Kuliner'}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-800 hover:bg-zinc-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Keluar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('login')}
              className="rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Masuk
            </button>
          )}
        </div>

        {/* Tombol Menu Mobile */}
        <button
          type="button"
          aria-label={mobileMenuOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-100 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Panel Navigasi Mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-2">
          <button
            type="button"
            onClick={() => handleSelectPage('peta')}
            className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
              activePage === 'peta'
                ? 'bg-red-50 text-red-700 font-semibold'
                : 'text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            Peta
          </button>
          <button
            type="button"
            onClick={() => handleSelectPage('daftar')}
            className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
              activePage === 'daftar'
                ? 'bg-red-50 text-red-700 font-semibold'
                : 'text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            Daftar Restoran
          </button>
          <button
            type="button"
            onClick={() => handleSelectPage('terdekat')}
            className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
              activePage === 'terdekat'
                ? 'bg-red-50 text-red-700 font-semibold'
                : 'text-zinc-700 hover:bg-zinc-50'
            }`}
          >
            Restoran Terdekat
          </button>
          {user && (
            <button
              type="button"
              onClick={() => handleSelectPage('pesanan')}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                activePage === 'pesanan'
                  ? 'bg-red-50 text-red-700 font-semibold'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              Pesanan Saya
            </button>
          )}
          {user?.role === 'admin' && (
            <button
              type="button"
              onClick={() => handleSelectPage('admin')}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium ${
                activePage === 'admin'
                  ? 'bg-red-50 text-red-700 font-semibold'
                  : 'text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              Kelola Data
            </button>
          )}
          <div className="pt-2 border-t border-zinc-200">
            {user ? (
              <div className="flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-sm font-semibold text-zinc-900">
                    {user.full_name}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {user.role === 'admin' ? 'Pengelola Data' : 'Pencari Kuliner'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLogout();
                  }}
                  className="rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-800"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Masuk
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
