import type { OrderType } from '../types';

export interface EtaInput {
  basePrepMinutes?: number;
  activeQueueCount?: number;
  cartItemCount?: number;
  orderType?: OrderType;
  now?: Date;
}

export interface EtaEstimate {
  minMinutes: number;
  maxMinutes: number;
  estimatedMinutes: number;
  readyAtLabel: string;
  queueLevel: 'sepi' | 'normal' | 'ramai';
  queueLevelLabel: string;
  recommendationText: string;
  factors: {
    baseMinutes: number;
    queueMinutes: number;
    itemMinutes: number;
    serviceMinutes: number;
    peakMinutes: number;
  };
}

export function formatWibTime(date: Date): string {
  try {
    return new Intl.DateTimeFormat('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).format(date);
  } catch {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}.${minutes}`;
  }
}

export function getWibDecimalHour(date: Date): number {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: false,
      timeZone: 'Asia/Jakarta',
    }).formatToParts(date);
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 12) % 24;
    const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return hour + minute / 60;
  } catch {
    return date.getHours() + date.getMinutes() / 60;
  }
}

export function isPeakDiningHour(date: Date): boolean {
  const decimalHour = getWibDecimalHour(date);
  const isLunchPeak = decimalHour >= 11.5 && decimalHour <= 13.5;
  const isDinnerPeak = decimalHour >= 18.0 && decimalHour <= 20.5;
  return isLunchPeak || isDinnerPeak;
}

export function calculateDynamicEta(input: EtaInput): EtaEstimate {
  const now = input.now ?? new Date();
  const baseMinutes = Math.max(5, Math.round(input.basePrepMinutes ?? 10));
  const queueCount = Math.max(0, Math.floor(input.activeQueueCount ?? 0));
  const itemCount = Math.max(0, Math.floor(input.cartItemCount ?? 0));
  const orderType: OrderType = input.orderType ?? 'dine_in';

  // Setiap pesanan aktif menambah waktu tunggu dapur 3 menit (maksimal 18 menit)
  const queueMinutes = Math.min(18, queueCount * 3);

  // Item menu pertama menambah 2 menit, tiap item tambahan +2 menit (maksimal 12 menit)
  const itemMinutes =
    itemCount === 0 ? 0 : Math.min(12, 2 + Math.max(0, itemCount - 1) * 2);

  // Makan di tempat perlu penyiapan penyajian meja (+2 menit), bawa pulang pengemasan (+1 menit)
  const serviceMinutes = orderType === 'dine_in' ? 2 : 1;

  // Jam makan siang / malam menambah 4 menit beban dapur
  const peak = isPeakDiningHour(now);
  const peakMinutes = peak ? 4 : 0;

  const estimatedMinutes =
    baseMinutes + queueMinutes + itemMinutes + serviceMinutes + peakMinutes;
  const minMinutes = Math.max(5, estimatedMinutes - 2);
  const maxMinutes = estimatedMinutes + 3;

  const readyAtDate = new Date(now.getTime() + estimatedMinutes * 60 * 1000);
  const readyAtLabel = `Sekitar pukul ${formatWibTime(readyAtDate)} WIB`;

  let queueLevel: 'sepi' | 'normal' | 'ramai' = 'normal';
  let queueLevelLabel = 'Antrean Normal';
  if (queueCount === 0 && !peak) {
    queueLevel = 'sepi';
    queueLevelLabel = 'Dapur Lengang';
  } else if (queueCount >= 3 || (peak && queueCount >= 1)) {
    queueLevel = 'ramai';
    queueLevelLabel = 'Jam Sibuk · Antrean Ramai';
  }

  const actionVerb =
    orderType === 'dine_in'
      ? 'agar hidangan siap disajikan saat Anda tiba'
      : 'agar pesanan siap diambil langsung di kasir';

  const recommendationText =
    itemCount === 0
      ? `Estimasi dapur saat ini ${minMinutes}–${maxMinutes} menit. Pilih menu dan pesan sekarang untuk tiba ${readyAtLabel.toLowerCase()} ${actionVerb}.`
      : `Estimasi selesai ${minMinutes}–${maxMinutes} menit (${readyAtLabel}). Disarankan tiba di restoran ${readyAtLabel.toLowerCase()} ${actionVerb}.`;

  return {
    minMinutes,
    maxMinutes,
    estimatedMinutes,
    readyAtLabel,
    queueLevel,
    queueLevelLabel,
    recommendationText,
    factors: {
      baseMinutes,
      queueMinutes,
      itemMinutes,
      serviceMinutes,
      peakMinutes,
    },
  };
}
