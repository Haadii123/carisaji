import { Clock, ExternalLink, ReceiptText, Store, ShoppingBag } from 'lucide-react';
import type { Order } from '../types';
import { formatRupiah, formatTanggalId } from '../utils/format';
import { getGoogleMapsDirectionsUrl } from '../utils/geo';
import {
  getOrderStatusLabel,
  getOrderTypeLabel,
  getPaymentMethodShortLabel,
  getPaymentStatusLabel,
} from '../utils/order';

interface OrdersPageProps {
  orders: Order[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onPayOrder: (order: Order) => void;
  onExploreRestaurants: () => void;
}

export function OrdersPage({
  orders,
  loading,
  error,
  onRefresh,
  onPayOrder,
  onExploreRestaurants,
}: OrdersPageProps) {
  return (
    <section
      aria-label="Pesanan Saya"
      className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
    >
      <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-wide text-red-600">
            Pesan &amp; Bayar · Ambil Sendiri
          </p>
          <h1 className="mt-1 font-display text-2xl font-bold tracking-tight text-zinc-950 sm:text-3xl">
            Pesanan Saya
          </h1>
          <p className="mt-1.5 text-sm text-zinc-600">
            Pantau status pembayaran QRIS/Virtual Account dan kesiapan makanan
            untuk makan di tempat maupun dibawa pulang.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-800 hover:bg-zinc-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          Muat Ulang Status
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-500">
          Memuat daftar pesanan Anda...
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-12 text-center space-y-3">
          <ReceiptText className="mx-auto h-10 w-10 text-zinc-300" />
          <h2 className="font-display text-lg font-bold text-zinc-900">
            Belum ada pesanan
          </h2>
          <p className="mx-auto max-w-md text-sm text-zinc-500">
            Pilih restoran dan menu favorit Anda, tentukan makan di tempat atau
            bawa pulang, lalu bayar praktis lewat QRIS atau Virtual Account.
          </p>
          <button
            type="button"
            onClick={onExploreRestaurants}
            className="mt-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
          >
            Jelajahi Daftar Restoran
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => {
            const isPaid = order.payment_status === 'lunas';
            return (
              <article
                key={order.order_id}
                className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col gap-3 border-b border-zinc-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="font-mono-tabular font-bold text-zinc-950">
                        {order.order_code}
                      </span>
                      <span aria-hidden="true" className="text-zinc-300">
                        ·
                      </span>
                      <span>{formatTanggalId(order.created_at)}</span>
                      <span aria-hidden="true" className="text-zinc-300">
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-700">
                        {order.order_type === 'dine_in' ? (
                          <Store className="h-3.5 w-3.5 text-zinc-400" />
                        ) : (
                          <ShoppingBag className="h-3.5 w-3.5 text-zinc-400" />
                        )}
                        {getOrderTypeLabel(order.order_type)}
                      </span>
                    </div>
                    <h2 className="mt-1 font-display text-lg font-bold text-zinc-950">
                      {order.restaurant_name}
                    </h2>
                  </div>

                  <div className="flex flex-col sm:items-end gap-1">
                    <span
                      className={`text-xs font-bold ${
                        isPaid ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {getPaymentStatusLabel(order.payment_status)} ·{' '}
                      {getOrderStatusLabel(order.order_status, order.order_type)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                      <Clock className="h-3.5 w-3.5 text-zinc-400" />
                      Estimasi tiba: {order.pickup_time}
                      {order.estimated_prep_minutes
                        ? ` · Siap ±${order.estimated_prep_minutes} mnt`
                        : ''}{' '}
                      · {getPaymentMethodShortLabel(order.payment_method)}
                    </span>
                  </div>
                </div>

                {/* Daftar Item */}
                <ul className="divide-y divide-zinc-100 text-sm">
                  {order.items.map((it, idx) => (
                    <li
                      key={`${it.order_item_id || idx}`}
                      className="flex items-center justify-between gap-4 py-2"
                    >
                      <span className="text-zinc-800">
                        <span className="font-mono-tabular font-semibold text-zinc-950">
                          {it.quantity}x
                        </span>{' '}
                        {it.item_name}
                      </span>
                      <span className="font-mono-tabular text-xs font-semibold text-zinc-800 shrink-0">
                        {formatRupiah(it.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                {order.customer_note && (
                  <p className="text-xs text-zinc-500">
                    Catatan pesanan: {order.customer_note}
                  </p>
                )}

                <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <span className="text-xs text-zinc-500">Total Bayar</span>
                    <p className="font-mono-tabular text-base font-bold text-zinc-950">
                      {formatRupiah(order.total_amount)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {order.restaurant_latitude && order.restaurant_longitude && (
                      <a
                        href={getGoogleMapsDirectionsUrl(
                          order.restaurant_latitude,
                          order.restaurant_longitude
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      >
                        <span>Petunjuk Arah</span>
                        <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => onPayOrder(order)}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        isPaid
                          ? 'border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50'
                          : 'bg-red-600 text-white hover:bg-red-700'
                      }`}
                    >
                      {isPaid ? 'Lihat Kode Ambil' : 'Bayar Sekarang'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
