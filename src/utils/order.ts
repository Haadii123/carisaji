import type {
  CartItem,
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from '../types';

export const PICKUP_TIME_OPTIONS = [
  '15 Menit Lagi',
  '30 Menit Lagi',
  '45 Menit Lagi',
  '1 Jam Lagi',
] as const;

export const PAYMENT_METHOD_OPTIONS: Array<{
  id: PaymentMethod;
  label: string;
  shortLabel: string;
  description: string;
  kind: 'qris' | 'va';
  bankCode?: string;
}> = [
  {
    id: 'qris',
    label: 'QRIS (Semua E-Wallet & Mobile Banking)',
    shortLabel: 'QRIS',
    description: 'Pindai kode QR menggunakan GoPay, OVO, DANA, ShopeePay, atau m-Banking.',
    kind: 'qris',
  },
  {
    id: 'va_bca',
    label: 'BCA Virtual Account',
    shortLabel: 'VA BCA',
    description: 'Transfer instan melalui myBCA, BCA Mobile, atau ATM BCA.',
    kind: 'va',
    bankCode: '3901',
  },
  {
    id: 'va_bri',
    label: 'BRI Virtual Account (BRIVA)',
    shortLabel: 'VA BRI',
    description: 'Pembayaran otomatis via aplikasi BRImo atau ATM BRI.',
    kind: 'va',
    bankCode: '88810',
  },
  {
    id: 'va_mandiri',
    label: 'Mandiri Virtual Account',
    shortLabel: 'VA Mandiri',
    description: 'Bayar melalui Livin’ by Mandiri atau jaringan ATM Mandiri.',
    kind: 'va',
    bankCode: '89022',
  },
  {
    id: 'va_bni',
    label: 'BNI Virtual Account',
    shortLabel: 'VA BNI',
    description: 'Transfer melalui wondr / BNI Mobile Banking atau ATM BNI.',
    kind: 'va',
    bankCode: '8277',
  },
];

export function calculateCartTotal(items: CartItem[]): {
  totalItems: number;
  totalAmount: number;
} {
  let totalItems = 0;
  let totalAmount = 0;
  for (const item of items) {
    const qty = Math.max(0, Math.floor(item.quantity));
    totalItems += qty;
    totalAmount += item.price * qty;
  }
  return { totalItems, totalAmount };
}

export function generateVirtualAccountNumber(
  method: PaymentMethod,
  orderId: number,
  userId: number
): string | null {
  const option = PAYMENT_METHOD_OPTIONS.find((opt) => opt.id === method);
  if (!option || option.kind !== 'va' || !option.bankCode) {
    return null;
  }
  const userPad = String(userId % 1000).padStart(3, '0');
  const orderPad = String(100000 + orderId).slice(-6);
  return `${option.bankCode}0812${userPad}${orderPad}`;
}

export function generateOrderCode(orderId: number): string {
  return `CSJ-${String(1000 + orderId)}`;
}

export function getOrderTypeLabel(orderType: OrderType): string {
  return orderType === 'dine_in' ? 'Makan di Tempat' : 'Bawa Pulang';
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  return (
    PAYMENT_METHOD_OPTIONS.find((opt) => opt.id === method)?.label || method
  );
}

export function getPaymentMethodShortLabel(method: PaymentMethod): string {
  return (
    PAYMENT_METHOD_OPTIONS.find((opt) => opt.id === method)?.shortLabel ||
    method
  );
}

export function getPaymentStatusLabel(status: PaymentStatus): string {
  return status === 'lunas' ? 'Lunas' : 'Menunggu Pembayaran';
}

export function getOrderStatusLabel(
  status: OrderStatus,
  orderType: OrderType
): string {
  switch (status) {
    case 'menunggu_pembayaran':
      return 'Menunggu Pembayaran';
    case 'sedang_disiapkan':
      return 'Sedang Disiapkan Dapur';
    case 'siap_diambil':
      return orderType === 'dine_in'
        ? 'Siap Disajikan di Tempat'
        : 'Siap Diambil di Kasir';
    case 'selesai':
      return 'Pesanan Selesai';
    default:
      return status;
  }
}

/**
 * Menghasilkan matriks QR Code deterministik 21x21 untuk visualisasi QRIS dari string kode pesanan.
 */
export function buildQrMatrix(seedText: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array(size).fill(false)
  );

  const drawFinder = (startRow: number, startCol: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[startRow + r][startCol + c] = isBorder || isCenter;
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 7);
  drawFinder(size - 7, 0);

  let hash = 2166136261;
  for (let i = 0; i < seedText.length; i++) {
    hash ^= seedText.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 8 && c < 8;
      const inTopRight = r < 8 && c >= size - 8;
      const inBottomLeft = r >= size - 8 && c < 8;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      if (r === 6 || c === 6) {
        matrix[r][c] = (r + c) % 2 === 0;
        continue;
      }

      hash ^= (r * 31 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = (hash >>> 0) % 2 === 0;
    }
  }

  return matrix;
}
