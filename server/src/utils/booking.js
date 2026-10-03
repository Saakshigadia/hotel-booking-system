// Pure booking logic, kept separate from Express and MongoDB so it is easy to test.

const DAY_MS = 24 * 60 * 60 * 1000;

// Parse "YYYY-MM-DD" as a UTC date so time zones never shift a stay by a day.
function parseDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function nightsBetween(checkIn, checkOut) {
  return Math.round((checkOut - checkIn) / DAY_MS);
}

// Two stays clash when one starts before the other ends.
// Check-out day is free, so a guest can check in the same day another checks out.
function overlaps(aIn, aOut, bIn, bOut) {
  return aIn < bOut && bIn < aOut;
}

// Returns { checkIn, checkOut, nights } or { error }.
function validateStay(checkInStr, checkOutStr, today = new Date(), maxNights = 30) {
  const checkIn = parseDate(checkInStr);
  const checkOut = parseDate(checkOutStr);
  if (!checkIn || !checkOut) return { error: 'Dates must be in YYYY-MM-DD format' };
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  if (checkIn.getTime() < todayUtc) return { error: 'Check-in cannot be in the past' };
  const nights = nightsBetween(checkIn, checkOut);
  if (nights < 1) return { error: 'Check-out must be after check-in' };
  if (nights > maxNights) return { error: `Stays are limited to ${maxNights} nights` };
  return { checkIn, checkOut, nights };
}

function totalPrice(pricePerNight, nights) {
  return pricePerNight * nights;
}

module.exports = { parseDate, nightsBetween, overlaps, validateStay, totalPrice, DAY_MS };
