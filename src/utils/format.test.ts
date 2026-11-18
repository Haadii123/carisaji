import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatRupiah,
  detectRestaurantBrand,
  groupMenusByCategory,
  getBrandImage,
} from './format';

test('formatRupiah memformat harga ke Rupiah tanpa desimal', () => {
  assert.equal(formatRupiah(41500), 'Rp 41.500');
  assert.equal(formatRupiah(162000), 'Rp 162.000');
  assert.equal(formatRupiah(0), 'Rp 0');
});

test('detectRestaurantBrand mengenali seluruh merek cepat saji di Pangkalpinang', () => {
  assert.equal(detectRestaurantBrand('KFC Coffee Selindung'), 'KFC');
  assert.equal(detectRestaurantBrand("McDonald's Pangkalpinang"), "McDonald's");
  assert.equal(
    detectRestaurantBrand('Richeese Factory Pangkal Pinang'),
    'Richeese Factory'
  );
  assert.equal(detectRestaurantBrand('A&W Transmall Pangkalpinang'), 'A&W');
  assert.equal(
    detectRestaurantBrand('ALMAZ Fried Chicken Pangkalpinang'),
    'Almaz Fried Chicken'
  );
  assert.equal(detectRestaurantBrand('JChicken Pangkalpinang'), 'JChicken');
  assert.equal(detectRestaurantBrand('KAREN CHICKEN BALAI'), 'Karen Chicken');
});

test('groupMenusByCategory mengelompokkan menu berdasarkan kategori', () => {
  const grouped = groupMenusByCategory([
    { menu_id: 1, restaurant_id: 1, item_name: 'Super Besar 1', price: 41500, category: 'Paket Kombo' },
    { menu_id: 2, restaurant_id: 1, item_name: 'Kopi Susu', price: 22000, category: 'KFC Coffee' },
    { menu_id: 3, restaurant_id: 1, item_name: 'Super Besar 2', price: 54500, category: 'Paket Kombo' },
  ]);
  assert.equal(grouped.length, 2);
  assert.equal(grouped[0].category, 'Paket Kombo');
  assert.equal(grouped[0].items.length, 2);
  assert.equal(grouped[1].category, 'KFC Coffee');
  assert.equal(grouped[1].items.length, 1);
});

test('getBrandImage selalu mengembalikan path gambar lokal yang valid', () => {
  assert.ok(getBrandImage('KFC Pangkalpinang').startsWith('/src/assets/images/'));
  assert.ok(
    getBrandImage('ALMAZ Fried Chicken Pangkalpinang').includes('spiced_kebuli')
  );
});
