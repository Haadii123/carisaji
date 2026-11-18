import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateHaversineKm,
  formatDistanceId,
  normalizeCoordinates,
  sortRestaurantsByDistance,
  getGoogleMapsDirectionsUrl,
} from './geo';

test('normalizeCoordinates memperbaiki urutan X/Y MySQL 8 jika lat > 90', () => {
  const normalized = normalizeCoordinates(106.111695, -2.098677);
  assert.equal(normalized.latitude, -2.098677);
  assert.equal(normalized.longitude, 106.111695);

  const alreadyValid = normalizeCoordinates(-2.1292, 106.1107);
  assert.equal(alreadyValid.latitude, -2.1292);
  assert.equal(alreadyValid.longitude, 106.1107);
});

test('calculateHaversineKm menghitung jarak realistis antar titik Pangkalpinang', () => {
  // Dari pusat kota (-2.1292, 106.1107) ke KFC Selindung (-2.098677, 106.111695)
  const km = calculateHaversineKm(-2.1292, 106.1107, -2.098677, 106.111695);
  assert.ok(km > 3.0 && km < 4.0, `Expected ~3.4 km, got ${km}`);
});

test('formatDistanceId memformat meter dan kilometer dalam Bahasa Indonesia', () => {
  assert.equal(formatDistanceId(0.452), '452 m');
  assert.equal(formatDistanceId(2.36), '2,4 km');
  assert.equal(formatDistanceId(0), '0 m');
});

test('sortRestaurantsByDistance mengurutkan restoran dari terdekat ke terjauh', () => {
  const list = [
    { id: 'jauh', latitude: -2.098677, longitude: 106.111695 },
    { id: 'dekat', latitude: -2.128592, longitude: 106.107662 },
  ];
  const sorted = sortRestaurantsByDistance(list, -2.1292, 106.1107);
  assert.equal(sorted[0].id, 'dekat');
  assert.equal(sorted[1].id, 'jauh');
  assert.ok(sorted[0].distanceKm < sorted[1].distanceKm);
});

test('getGoogleMapsDirectionsUrl menghasilkan URL petunjuk arah yang valid', () => {
  const url = getGoogleMapsDirectionsUrl(-2.1292, 106.1107);
  assert.equal(
    url,
    'https://www.google.com/maps/dir/?api=1&destination=-2.1292%2C106.1107'
  );
});
