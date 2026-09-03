import { describe, it, expect } from 'vitest';
import { adToBs, bsToAd } from '../src/services/bs-converter';

describe('Bikram Sambat (B.S.) Calendar Engine', () => {
  it('converts Gregorian AD date to Bikram Sambat BS', () => {
    // 2026-09-03 AD corresponds to Bhadra 18, 2083 BS
    const adDate = new Date('2026-09-03T12:00:00Z');
    const bs = adToBs(adDate);

    expect(bs.year).toBe(2083);
    expect(bs.monthNameEn).toBe('Bhadra');
    expect(bs.formattedEn).toContain('2083 B.S.');
  });

  it('performs round-trip conversion from BS to AD', () => {
    const year = 2083;
    const month = 5; // Bhadra
    const day = 18;

    const ad = bsToAd(year, month, day);
    expect(ad).toBeInstanceOf(Date);

    const backToBs = adToBs(ad);
    expect(backToBs.year).toBe(year);
    expect(backToBs.month).toBe(month);
    expect(backToBs.day).toBe(day);
  });
});
