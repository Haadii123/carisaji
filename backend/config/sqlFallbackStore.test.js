import test from 'node:test';
import assert from 'node:assert/strict';
import { getSqlFallbackStore } from './sqlFallbackStore.js';

test('getSqlFallbackStore memuat seluruh tabel dan baris dari database/carisaji.sql', () => {
  const store = getSqlFallbackStore();
  assert.equal(store.users.length, 5);
  assert.equal(store.restaurants.length, 12);
  assert.equal(store.menus.length, 69);
  assert.equal(store.reviews.length, 24);
  assert.equal(store.orders.length, 3);
  assert.equal(store.order_items.length, 5);

  const mcd = store.restaurants.find((r) => Number(r.restaurant_id) === 6);
  assert.equal(mcd?.name, "McDonald's Pangkalpinang");

  const admin = store.users.find((u) => u.email === 'admin@carisaji.id');
  assert.equal(admin?.role, 'admin');
  assert.ok(String(admin?.password).startsWith('$2b$10$'));
});
