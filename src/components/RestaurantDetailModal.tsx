import { FormEvent, useEffect, useState } from 'react';
import { ExternalLink, MapPin, Star, Utensils, X } from 'lucide-react';
import { api } from '../services/api';
import type { RestaurantDetail, User } from '../types';
import {
  detectRestaurantBrand,
  formatRupiah,
  formatTanggalId,
  getBrandImage,
  groupMenusByCategory,
} from '../utils/format';
import { getGoogleMapsDirectionsUrl } from '../utils/geo';

interface RestaurantDetailModalProps {
  restaurantId: number | null;
  user: User | null;
  onClose: () => void;
  onRequireLogin: () => void;
  onReviewSubmitted: () => void;
}

export function RestaurantDetailModal({
  restaurantId,
  user,
  onClose,
  onRequireLogin,
  onReviewSubmitted,
}: RestaurantDetailModalProps) {
  const [detail, setDetail] = useState<RestaurantDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imageFailed, setImageFailed] = useState(false);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  useEffect(() => {
    if (!restaurantId) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');
    setImageFailed(false);
    setReviewError('');
    setReviewSuccess('');
    setRating(5);
    setComment('');

    api
      .getRestaurantDetail(restaurantId)
      .then((res) => {
        if (!cancelled) {
          setDetail(res.restaurant);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal memuat detail restoran.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [restaurantId, onClose]);

  if (!restaurantId) return null;

  const handleSubmitReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setReviewError('');
    setReviewSuccess('');

    if (!comment.trim()) {
      setReviewError('Tuliskan komentar ulasan Anda terlebih dahulu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createReview(detail.restaurant_id, {
        rating,
        comment: comment.trim(),
      });
      setComment('');
      setRating(5);
      setReviewSuccess(res.message);
      const refreshed = await api.getRestaurantDetail(detail.restaurant_id);
      setDetail(refreshed.restaurant);
      onReviewSubmitted();
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : 'Gagal mengirim ulasan.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const groupedMenus = detail ? groupMenusByCategory(detail.menus) : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/55 p-4 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-modal-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        {/* Header Modal */}
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-medium text-zinc-500">
              {detail
                ? `${detectRestaurantBrand(detail.name)} · Jam Buka ${
                    detail.operating_hours
                  }`
                : 'Memuat informasi restoran'}
            </p>
            <h2
              id="detail-modal-title"
              className="mt-0.5 font-display text-xl font-bold text-zinc-950 truncate"
            >
              {detail ? detail.name : 'Detail Restoran'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Tutup detail restoran"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Konten Scrollable */}
        <div className="overflow-y-auto px-6 py-5">
          {loading && (
            <div className="space-y-4 py-8 text-center text-sm text-zinc-500">
              Memuat menu dan ulasan pelanggan...
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
            >
              {error}
            </div>
          )}

          {!loading && !error && detail && (
            <div className="space-y-6">
              {/* Info Utama & Aksi */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr] items-stretch">
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 aspect-4/3 md:aspect-auto md:h-40">
                  {!imageFailed ? (
                    <img
                      src={getBrandImage(detail.name)}
                      alt={detail.name}
                      referrerPolicy="no-referrer"
                      onError={() => setImageFailed(true)}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-400">
                      <Utensils className="h-8 w-8" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-700">
                      <span className="inline-flex items-center gap-1 font-semibold text-zinc-900 tabular-nums">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        {detail.avg_rating > 0
                          ? detail.avg_rating.toFixed(1).replace('.', ',')
                          : 'Baru'}
                      </span>
                      <span aria-hidden="true" className="text-zinc-300">
                        ·
                      </span>
                      <span className="tabular-nums text-zinc-600">
                        {detail.review_count} ulasan pelanggan
                      </span>
                      <span aria-hidden="true" className="text-zinc-300">
                        ·
                      </span>
                      <span className="tabular-nums text-zinc-600">
                        {detail.menus.length} item menu
                      </span>
                    </div>

                    <p className="mt-2.5 flex items-start gap-2 text-sm text-zinc-600 leading-relaxed">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
                      <span>{detail.address}</span>
                    </p>
                    <p className="mt-1 font-mono-tabular text-xs text-zinc-500">
                      Koordinat: {detail.latitude.toFixed(5)},{' '}
                      {detail.longitude.toFixed(5)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <a
                      href={getGoogleMapsDirectionsUrl(
                        detail.latitude,
                        detail.longitude
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                    >
                      <span>Petunjuk Arah</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Grid Menu & Ulasan */}
              <div className="grid grid-cols-1 gap-8 border-t border-zinc-200 pt-6 lg:grid-cols-2">
                {/* Kolom Kiri: Daftar Menu */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-base font-bold text-zinc-950">
                      Daftar Menu
                    </h3>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      {detail.menus.length} pilihan
                    </span>
                  </div>

                  {groupedMenus.length === 0 ? (
                    <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-5 text-sm text-zinc-500">
                      Belum ada daftar menu yang ditambahkan untuk gerai ini.
                    </div>
                  ) : (
                    <div className="mt-3 space-y-5">
                      {groupedMenus.map((group) => (
                        <div key={group.category}>
                          <h4 className="border-b border-zinc-200 pb-1.5 text-xs font-semibold tracking-wide text-zinc-500">
                            {group.category}
                          </h4>
                          <ul className="divide-y divide-zinc-100">
                            {group.items.map((item) => (
                              <li
                                key={item.menu_id}
                                className="flex items-start justify-between gap-4 py-2.5 text-sm"
                              >
                                <span className="text-zinc-800 leading-snug">
                                  {item.item_name}
                                </span>
                                <span className="font-mono-tabular text-xs font-semibold text-zinc-900 whitespace-nowrap shrink-0 pt-0.5">
                                  {formatRupiah(item.price)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Kolom Kanan: Ulasan & Form */}
                <div>
                  <div className="flex items-baseline justify-between">
                    <h3 className="font-display text-base font-bold text-zinc-950">
                      Ulasan Pelanggan
                    </h3>
                    <span className="text-xs text-zinc-500 tabular-nums">
                      {detail.reviews.length} ulasan
                    </span>
                  </div>

                  {/* Form Tambah Ulasan */}
                  <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    {user ? (
                      <form onSubmit={handleSubmitReview} className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-zinc-700">
                            Beri Penilaian Anda
                          </span>
                          <div
                            className="flex items-center gap-1"
                            role="radiogroup"
                            aria-label="Pilih rating bintang"
                          >
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                aria-label={`${star} bintang`}
                                onClick={() => setRating(star)}
                                className="p-1 cursor-pointer transition-transform hover:scale-110"
                              >
                                <Star
                                  className={`h-5 w-5 ${
                                    star <= rating
                                      ? 'fill-amber-500 text-amber-500'
                                      : 'text-zinc-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label
                            htmlFor="review-comment"
                            className="sr-only"
                          >
                            Komentar Ulasan
                          </label>
                          <textarea
                            id="review-comment"
                            rows={2}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Bagikan pengalaman rasa, layanan, atau suasana di sini..."
                            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 focus:outline-none"
                          />
                        </div>

                        {reviewError && (
                          <p className="text-xs font-medium text-red-600">
                            {reviewError}
                          </p>
                        )}
                        {reviewSuccess && (
                          <p className="text-xs font-medium text-emerald-700">
                            {reviewSuccess}
                          </p>
                        )}

                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-60 transition-colors cursor-pointer"
                        >
                          {submitting ? 'Mengirim...' : 'Kirim Ulasan'}
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <p className="text-xs text-zinc-600">
                          Ingin berbagi penilaian tentang restoran ini? Silakan
                          masuk terlebih dahulu.
                        </p>
                        <button
                          type="button"
                          onClick={onRequireLogin}
                          className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          Masuk untuk Mengulas
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Daftar Ulasan */}
                  <div className="mt-4 space-y-3">
                    {detail.reviews.length === 0 ? (
                      <p className="py-4 text-sm text-zinc-500">
                        Belum ada ulasan untuk gerai ini. Jadilah yang pertama
                        memberikan ulasan!
                      </p>
                    ) : (
                      detail.reviews.map((rev) => (
                        <article
                          key={rev.review_id}
                          className="rounded-xl border border-zinc-200 bg-white p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-zinc-900">
                              {rev.full_name}
                            </p>
                            <div className="flex items-center gap-1 text-xs font-semibold text-zinc-800 tabular-nums">
                              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                              <span>{rev.rating}/5</span>
                            </div>
                          </div>
                          <p className="mt-1.5 text-sm text-zinc-700 leading-relaxed">
                            {rev.comment}
                          </p>
                          <p className="mt-2 text-xs text-zinc-400">
                            {formatTanggalId(rev.created_at)}
                          </p>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
