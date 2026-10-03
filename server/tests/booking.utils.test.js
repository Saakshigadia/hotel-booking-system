const { parseDate, nightsBetween, overlaps, validateStay, totalPrice } = require('../src/utils/booking');

const d = (s) => parseDate(s);
const TODAY = new Date('2026-10-01T10:00:00Z');

describe('date parsing', () => {
  test('accepts YYYY-MM-DD', () => expect(d('2026-12-20').toISOString()).toBe('2026-12-20T00:00:00.000Z'));
  test('rejects other formats', () => {
    expect(d('20-12-2026')).toBeNull();
    expect(d('2026-13-40')).toBeNull();
    expect(d(undefined)).toBeNull();
  });
});

describe('nights and price', () => {
  test('counts nights between dates', () => expect(nightsBetween(d('2026-12-20'), d('2026-12-23'))).toBe(3));
  test('works across month end', () => expect(nightsBetween(d('2026-12-30'), d('2027-01-02'))).toBe(3));
  test('price = nights x rate', () => expect(totalPrice(4800, 3)).toBe(14400));
});

describe('overlap rules', () => {
  const a = [d('2026-12-20'), d('2026-12-23')];
  test('stays inside another stay clash', () => expect(overlaps(...a, d('2026-12-21'), d('2026-12-22'))).toBe(true));
  test('partly overlapping stays clash', () => expect(overlaps(...a, d('2026-12-22'), d('2026-12-25'))).toBe(true));
  test('checking in on someone else\'s check-out day is fine', () => expect(overlaps(...a, d('2026-12-23'), d('2026-12-25'))).toBe(false));
  test('separate stays do not clash', () => expect(overlaps(...a, d('2026-12-26'), d('2026-12-28'))).toBe(false));
});

describe('validateStay', () => {
  test('valid stay', () => expect(validateStay('2026-12-20', '2026-12-23', TODAY)).toMatchObject({ nights: 3 }));
  test('same-day booking allowed', () => expect(validateStay('2026-10-01', '2026-10-02', TODAY).error).toBeUndefined());
  test('past check-in rejected', () => expect(validateStay('2026-09-30', '2026-10-02', TODAY).error).toMatch(/past/));
  test('check-out before check-in rejected', () => expect(validateStay('2026-12-23', '2026-12-20', TODAY).error).toMatch(/after/));
  test('zero nights rejected', () => expect(validateStay('2026-12-20', '2026-12-20', TODAY).error).toMatch(/after/));
  test('very long stays rejected', () => expect(validateStay('2026-12-01', '2027-01-15', TODAY).error).toMatch(/30 nights/));
});
