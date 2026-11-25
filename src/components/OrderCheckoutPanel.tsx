import { FormEvent, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Landmark,
  QrCode,
  ShoppingBag,
  Store,
} from 'lucide-react';
import { api } from '../services/api';
import type { CartItem, Order, OrderType, PaymentMethod, User } from '../types';
import { formatRupiah } from '../utils/format';
import {
  calculateCartTotal,
  PAYMENT_METHOD_OPTIONS,
  PICKUP_TIME_OPTIONS,
} from '../utils/order';
import { calculateDynamicEta } from '../utils/eta';

interface OrderCheckoutPanelProps {
  restaurantId: number;
  restaurantName: string;
  basePrepMinutes?: number;
  activeQueueCount?: number;
  cart: CartItem[];
  user: User | null;
  onBack: () => void;
  onUpdateQuantity: (menuId: number, delta: number) => void;
  onRequireLogin: () => void;
  onOrderCreated: (order: Order) => void;
}

export function OrderCheckoutPanel({
  restaurantId,
  restaurantName,
  basePrepMinutes,
  activeQueueCount,
  cart,
  user,
  onBack,
  onUpdateQuantity,
  onRequireLogin,
  onOrderCreated,
}: OrderCheckoutPanelProps) {
  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [pickupTime, setPickupTime] = useState<string>(PICKUP_TIME_OPTIONS[0]);
  const [customerNote, setCustomerNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { totalItems, totalAmount } = calculateCartTotal(cart);
  const liveEta = calculateDynamicEta({
    basePrepMinutes,
    activeQueueCount,
    cartItemCount: totalItems,
    orderType,
  });

  const handleSubmitOrder = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      onRequireLogin();
      return;
    }

    if (cart.length === 0) {
      setError('Keranjang masih kosong. Pilih minimal satu menu.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.createOrder({
        restaurant_id: restaurantId,
        order_type: orderType,
        pickup_time: pickupTime,
        customer_note: customerNote.trim() || undefined,
        payment_method: paymentMethod,
        items: cart.map((c) => ({ menu_id: c.menu_id, quantity: c.quantity })),
      });
      onOrderCreated(res.order);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal membuat pesanan baru.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitOrder} className="space-y-6">
      <div className="flex items-center justify-between gap-4 border-b border-zinc-200 pb-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 hover:text-zinc-950 cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali ke Daftar Menu</span>
        </button>
        <span className="text-xs text-zinc-500 tabular-nums">
          {totalItems} item dipilih
        </span>
      </div>

      {/* Info Penting: Pesan & Bayar, Ambil Sendiri + ETA Dinamis */}
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-700 leading-relaxed space-y-1.5">
        <p>
          <strong className="font-semibold text-zinc-950">
            Layanan Pesan &amp; Bayar di Tempat / Ambil Sendiri:
          </strong>{' '}
          Tidak melayani pengantaran. Pesanan langsung dimasak setelah
          pembayaran diterima di{' '}
          <span className="font-semibold text-zinc-900">{restaurantName}</span>.
        </p>
        <p className="text-zinc-900">
          <strong className="font-semibold text-red-700">
            Estimasi Selesai Dapur: {liveEta.minMinutes}–{liveEta.maxMinutes}{' '}
            menit ({liveEta.readyAtLabel})
          </strong>{' '}
          · {liveEta.queueLevelLabel} ({activeQueueCount ?? 0} pesanan aktif)
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Kolom Kiri: Metode Layanan, Waktu Kedatangan, Ringkasan Menu */}
        <div className="space-y-5">
          <div>
            <p className="text-xs font-semibold text-zinc-700">
              1. Pilih Metode Pengambilan
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOrderType('dine_in')}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                  orderType === 'dine_in'
                    ? 'border-red-600 bg-red-50/70 text-zinc-950'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                  <Store className="h-4 w-4 text-red-600" />
                  <span>Makan di Tempat</span>
                </span>
                <span className="text-xs text-zinc-500 leading-snug">
                  Makanan langsung siap disajikan saat Anda tiba.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('takeaway')}
                className={`flex flex-col items-start gap-1 rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                  orderType === 'takeaway'
                    ? 'border-red-600 bg-red-50/70 text-zinc-950'
                    : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <span className="inline-flex items-center gap-1.5 text-sm font-bold">
                  <ShoppingBag className="h-4 w-4 text-red-600" />
                  <span>Bawa Pulang</span>
                </span>
                <span className="text-xs text-zinc-500 leading-snug">
                  Dikemas rapi, tinggal ambil sendiri di kasir.
                </span>
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="pickup-time-select"
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700"
            >
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              <span>
                2.{' '}
                {orderType === 'dine_in'
                  ? 'Perkiraan Waktu Tiba di Restoran'
                  : 'Perkiraan Waktu Pengambilan'}
              </span>
            </label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PICKUP_TIME_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setPickupTime(opt)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    pickupTime === opt
                      ? 'bg-zinc-900 text-white'
                      : 'border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="order-note"
              className="block text-xs font-semibold text-zinc-700"
            >
              Catatan untuk Restoran (Opsional)
            </label>
            <input
              id="order-note"
              type="text"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              placeholder={
                orderType === 'dine_in'
                  ? 'Contoh: 2 orang, sambal dipisah, area AC'
                  : 'Contoh: Saus sambal lebih, tanpa es'
              }
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-red-600 focus:outline-none"
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-zinc-700">
              Ringkasan Pesanan
            </p>
            <ul className="mt-2 divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white px-3.5">
              {cart.map((item) => (
                <li
                  key={item.menu_id}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-900 truncate">
                      {item.item_name}
                    </p>
                    <p className="font-mono-tabular text-xs text-zinc-500">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      aria-label={`Kurangi ${item.item_name}`}
                      onClick={() => onUpdateQuantity(item.menu_id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-mono-tabular text-xs font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Tambah ${item.item_name}`}
                      onClick={() => onUpdateQuantity(item.menu_id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-100 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Kolom Kanan: Pilih Pembayaran QRIS / VA Bank */}
        <div className="flex flex-col justify-between space-y-5">
          <div>
            <p className="text-xs font-semibold text-zinc-700">
              3. Metode Pembayaran (QRIS / Virtual Account)
            </p>
            <div className="mt-2 space-y-2">
              {PAYMENT_METHOD_OPTIONS.map((opt) => {
                const selected = paymentMethod === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                      selected
                        ? 'border-red-600 bg-red-50/60'
                        : 'border-zinc-200 bg-white hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={opt.id}
                      checked={selected}
                      onChange={() => setPaymentMethod(opt.id)}
                      className="mt-1 accent-red-600"
                    />
                    <div className="min-w-0">
                      <span className="flex items-center gap-1.5 text-sm font-semibold text-zinc-950">
                        {opt.kind === 'qris' ? (
                          <QrCode className="h-4 w-4 text-red-600 shrink-0" />
                        ) : (
                          <Landmark className="h-4 w-4 text-zinc-700 shrink-0" />
                        )}
                        <span>{opt.label}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {opt.description}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-600">Total Pembayaran</span>
              <span className="font-mono-tabular text-lg font-bold text-zinc-950">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-600">{error}</p>
            )}

            {user ? (
              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {submitting ? 'Membuat Pesanan...' : 'Buat Pesanan & Bayar'}
              </button>
            ) : (
              <button
                type="button"
                onClick={onRequireLogin}
                className="w-full rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Masuk untuk Melanjutkan Pembayaran
              </button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
