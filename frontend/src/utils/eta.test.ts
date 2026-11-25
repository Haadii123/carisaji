import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateDynamicEta,
  formatWibTime,
  isPeakDiningHour,
} from './eta.ts';

test('calculateDynamicEta menghitung estimasi dasar saat dapur lengang di luar jam sibuk', () => {
  // 15:00 WIB = 08:00 UTC
  const offPeakUtc = new Date('2026-11-24T08:00:00Z');
  assert.equal(isPeakDiningHour(offPeakUtc), false);

  const eta = calculateDynamicEta({
    basePrepMinutes: 10,
    activeQueueCount: 0,
    cartItemCount: 1,
    orderType: 'takeaway',
    now: offPeakUtc,
  });

  // 10 base + 0 queue + 2 item + 1 takeaway + 0 peak = 13 menit
  assert.equal(eta.estimatedMinutes, 13);
  assert.equal(eta.minMinutes, 11);
  assert.equal(eta.maxMinutes, 16);
  assert.equal(eta.queueLevel, 'sepi');
  assert.equal(eta.readyAtLabel.includes('15'), true);
});

test('calculateDynamicEta menambah waktu tunggu saat antrean aktif & jam makan siang', () => {
  // 12:15 WIB = 05:15 UTC (jam makan siang)
  const lunchPeakUtc = new Date('2026-11-24T05:15:00Z');
  assert.equal(isPeakDiningHour(lunchPeakUtc), true);

  const eta = calculateDynamicEta({
    basePrepMinutes: 10,
    activeQueueCount: 3,
    cartItemCount: 3,
    orderType: 'dine_in',
    now: lunchPeakUtc,
  });

  // 10 base + 9 queue (3*3) + 6 items (2 + 2*2) + 2 dine_in + 4 peak = 31 menit
  assert.equal(eta.estimatedMinutes, 31);
  assert.equal(eta.queueLevel, 'ramai');
  assert.equal(eta.factors.queueMinutes, 9);
  assert.equal(eta.factors.peakMinutes, 4);
  assert.equal(eta.recommendationText.includes('disajikan'), true);
});

test('calculateDynamicEta membatasi lonjakan antrean dan jumlah item agar tetap realistis', () => {
  const offPeakUtc = new Date('2026-11-24T09:00:00Z');
  const eta = calculateDynamicEta({
    basePrepMinutes: 8,
    activeQueueCount: 20,
    cartItemCount: 15,
    orderType: 'takeaway',
    now: offPeakUtc,
  });

  assert.equal(eta.factors.queueMinutes, 18);
  assert.equal(eta.factors.itemMinutes, 12);
  assert.equal(eta.estimatedMinutes, 8 + 18 + 12 + 1);
});

test('formatWibTime memformat waktu dalam zona waktu WIB', () => {
  const utcDate = new Date('2026-11-24T05:05:00Z'); // 12:05 WIB
  const label = formatWibTime(utcDate);
  assert.match(label, /12[:.]05/);
});
