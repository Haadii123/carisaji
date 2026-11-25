import { useEffect, useState } from 'react';
import { Check, CheckCircle2, Copy, ExternalLink, QrCode, Landmark, X } from 'lucide-react';
import { api } from '../services/api';
import type { Order } from '../types';
import { formatRupiah } from '../utils/format';
import { getGoogleMapsDirectionsUrl } from '../utils/geo';
import {
  buildQrMatrix,
  getOrderStatusLabel,
  getOrderTypeLabel,
  getPaymentMethodLabel,
} from '../utils/order';

interface PaymentInstructionModalProps {
  order: Order | null;
  onClose: () => void;
  onOrderUpdated: (updatedOrder: Order, message: string) => void;
  onOpenMyOrders: () => void;
}

export function PaymentInstructionModal({
  order,
  onClose,
  onOrderUpdated,
  onOpenMyOrders,
}: PaymentInstructionModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setError('');
    setCopied(false);
  }, [order?.order_id]);

  useEffect(() => {
    if (!order) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [order, onClose]);

  if (!order) return null;

  const isPaid = order.payment_status === 'lunas';
  const isQris = order.payment_method === 'qris';
  const qrMatrix = isQris
    ? buildQrMatrix(`${order.order_code}|${order.total_amount}|CARISAJI`)
    : [];

  const handleCopyVa = async () => {
    if (!order.va_number) return;
    try {
      await navigator.clipboard.writeText(order.va_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback jika clipboard dibatasi
      setCopied(false);
    }
  };

  const handleConfirmPayment = async () => {
    setError('');
    setConfirming(true);
    try {
      const res = await api.confirmOrderPayment(order.order_id);
      onOrderUpdated(res.order, res.message);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal mengonfirmasi pembayaran.'
      );
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-4">
          <div>
            <p className="text-xs font-medium text-zinc-500">
              Kode Pesanan ·{' '}
              <span className="font-mono-tabular font-semibold text-zinc-900">
                {order.order_code}
              </span>
            </p>
            <h2
              id="payment-modal-title"
              className="mt-0.5 font-display text-lg font-bold text-zinc-950"
            >
              {isPaid ? 'Pembayaran Diterima' : 'Selesaikan Pembayaran'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Tutup jendela pembayaran"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-5">
          {/* Ringkasan Gerai & Metode Ambil Sendiri */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-1.5 text-sm">
            <p className="font-display font-bold text-zinc-950">
              {order.restaurant_name}
            </p>
            <p className="text-xs text-zinc-600">
              {getOrderTypeLabel(order.order_type)} · Estimasi Tiba:{' '}
              <strong className="text-zinc-900">{order.pickup_time}</strong>
              {order.estimated_prep_minutes
                ? ` · Estimasi siap ±${order.estimated_prep_minutes} menit`
                : ''}{' '}
              · Ambil Sendiri (Tanpa Pengantaran)
            </p>
            {order.customer_note && (
              <p className="text-xs text-zinc-500">
                Catatan: {order.customer_note}
              </p>
            )}
          </div>

          {isPaid ? (
            /* Status Lunas */
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center space-y-3">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
              <div>
                <p className="font-display text-base font-bold text-emerald-950">
                  {getOrderStatusLabel(order.order_status, order.order_type)}
                </p>
                <p className="mt-1 text-xs text-emerald-800 leading-relaxed">
                  {order.order_type === 'dine_in'
                    ? 'Pesanan Anda sedang disiapkan dapur. Tunjukkan kode pesanan di bawah ini saat tiba agar makanan langsung disajikan.'
                    : 'Pesanan Anda sedang disiapkan dapur. Tunjukkan kode pesanan di kasir untuk mengambil pesanan Anda.'}
                </p>
              </div>
              <div className="mx-auto inline-block rounded-xl border border-emerald-300 bg-white px-5 py-2.5">
                <p className="text-xs text-zinc-500">Kode Pengambilan</p>
                <p className="font-mono-tabular text-xl font-bold tracking-wider text-zinc-950">
                  {order.order_code}
                </p>
              </div>
            </div>
          ) : (
            /* Instruksi QRIS atau Virtual Account */
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-zinc-100 pb-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                  {isQris ? (
                    <QrCode className="h-4 w-4 text-red-600" />
                  ) : (
                    <Landmark className="h-4 w-4 text-red-600" />
                  )}
                  <span>{getPaymentMethodLabel(order.payment_method)}</span>
                </div>
                <span className="font-mono-tabular text-base font-bold text-red-600">
                  {formatRupiah(order.total_amount)}
                </span>
              </div>

              {isQris ? (
                <div className="flex flex-col items-center gap-3 py-1">
                  <div
                    data-testid="qris-code-matrix"
                    className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs"
                  >
                    <p className="mb-2 text-center text-xs font-bold tracking-wide text-zinc-900">
                      QRIS · CARISAJI
                    </p>
                    <svg
                      width="168"
                      height="168"
                      viewBox="0 0 21 21"
                      role="img"
                      aria-label={`Kode QRIS untuk pesanan ${order.order_code}`}
                      className="block"
                    >
                      <rect width="21" height="21" fill="#FFFFFF" />
                      {qrMatrix.map((row, rIdx) =>
                        row.map((filled, cIdx) =>
                          filled ? (
                            <rect
                              key={`${rIdx}-${cIdx}`}
                              x={cIdx}
                              y={rIdx}
                              width="1"
                              height="1"
                              fill="#18181B"
                            />
                          ) : null
                        )
                      )}
                    </svg>
                  </div>
                  <p className="text-center text-xs text-zinc-500 max-w-xs">
                    Pindai kode QRIS di atas melalui aplikasi e-wallet atau
                    mobile banking Anda, lalu konfirmasi pembayaran di bawah.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-500">
                    Nomor Virtual Account Tujuan
                  </p>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                    <span
                      data-testid="va-number-display"
                      className="font-mono-tabular text-lg font-bold tracking-wide text-zinc-950"
                    >
                      {order.va_number}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyVa}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 cursor-pointer shrink-0"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Transfer tepat sebesar{' '}
                    <strong className="text-zinc-900">
                      {formatRupiah(order.total_amount)}
                    </strong>{' '}
                    ke nomor Virtual Account di atas melalui m-Banking atau ATM.
                  </p>
                </div>
              )}

              {error && (
                <p className="text-xs font-medium text-red-600">{error}</p>
              )}

              <button
                type="button"
                disabled={confirming}
                onClick={handleConfirmPayment}
                className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {confirming
                  ? 'Memverifikasi Pembayaran...'
                  : isQris
                  ? 'Saya Sudah Bayar via QRIS'
                  : 'Saya Sudah Transfer (Konfirmasi Bayar)'}
              </button>
            </div>
          )}

          {/* Rincian Item */}
          <div>
            <p className="text-xs font-semibold text-zinc-500">Rincian Menu</p>
            <ul className="mt-2 divide-y divide-zinc-100 border-t border-b border-zinc-100 text-sm">
              {order.items.map((item, idx) => (
                <li
                  key={`${item.order_item_id || idx}`}
                  className="flex items-center justify-between gap-4 py-2"
                >
                  <span className="text-zinc-800">
                    <span className="font-mono-tabular font-semibold text-zinc-950">
                      {item.quantity}x
                    </span>{' '}
                    {item.item_name}
                  </span>
                  <span className="font-mono-tabular text-xs font-semibold text-zinc-900 shrink-0">
                    {formatRupiah(item.subtotal)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-center justify-between text-sm font-bold text-zinc-950">
              <span>Total Pembayaran</span>
              <span className="font-mono-tabular text-base">
                {formatRupiah(order.total_amount)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {order.restaurant_latitude && order.restaurant_longitude ? (
              <a
                href={getGoogleMapsDirectionsUrl(
                  order.restaurant_latitude,
                  order.restaurant_longitude
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                <span>Petunjuk Arah ke Restoran</span>
                <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              </a>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenMyOrders();
              }}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 cursor-pointer"
            >
              Lihat Pesanan Saya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
