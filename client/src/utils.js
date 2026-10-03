export const rupees = (n) => `₹${Number(n).toLocaleString('en-IN')}`;

export const isoDay = (offset = 0) => {
  const d = new Date(Date.now() + offset * 864e5);
  return d.toISOString().slice(0, 10);
};

export const prettyDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export const nights = (a, b) => Math.round((new Date(b) - new Date(a)) / 864e5);
