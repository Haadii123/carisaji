import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQrMatrix,
  calculateCartTotal,
  generateOrderCode,
  generateVirtualAccountNumber,
  getOrderStatusLabel,
  getOrderTypeLabel,
} from './order';

test('calculateCartTotal menghitung jumlah item dan total Rupiah dengan akurat', () => {
  const result = calculateCartTotal([
    { menu_id: 1, item_name: 'Super Besar 1', price: 41500, quantity: 2 },
    { menu_id: 4, item_name: 'Kopi Susu', price: 22000, quantity: 1 },
  ]);
  assert.equal(result.totalItems, 3);
  assert.equal(result.totalAmount, 105000);
});

test('generateVirtualAccountNumber menghasilkan nomor VA sesuai kode bank atau null untuk QRIS', () => {
  assert.equal(generateVirtualAccountNumber('qris', 1, 2), null);
  const bca = generateVirtualAccountNumber('va_bca', 12, 5);
  const bri = generateVirtualAccountNumber('va_bri', 12, 5);
  assert.ok(bca?.startsWith('3901'));
  assert.ok(bri?.startsWith('88810'));
});

test('generateOrderCode dan label status berbahasa Indonesia sesuai metode pesanan', () => {
  assert.equal(generateOrderCode(7), 'CSJ-1007');
  assert.equal(getOrderTypeLabel('dine_in'), 'Makan di Tempat');
  assert.equal(getOrderTypeLabel('takeaway'), 'Bawa Pulang');
  assert.equal(
    getOrderStatusLabel('siap_diambil', 'dine_in'),
    'Siap Disajikan di Tempat'
  );
  assert.equal(
    getOrderStatusLabel('siap_diambil', 'takeaway'),
    'Siap Diambil di Kasir'
  );
});

test('buildQrMatrix menghasilkan matriks 21x21 deterministik dengan pola finder QR', () => {
  const m1 = buildQrMatrix('CSJ-1001|50000');
  const m2 = buildQrMatrix('CSJ-1001|50000');
  assert.equal(m1.length, 21);
  assert.equal(m1[0].length, 21);
  assert.deepEqual(m1, m2);
  // Corner finder top-left pixel
  assert.equal(m1[0][0], true);
  assert.equal(m1[1][1], false);
});
