// Browser-only stand-in for the Express API, used by the GitHub Pages demo.
// It follows the same rules as server/src/utils/booking.js.
import seedRooms from '../../../server/src/rooms.json';

const KEY = 'saakshi-stays-demo-db';
const DAY = 864e5;
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms));
const id = () => Math.random().toString(36).slice(2, 10);

function load() {
  try {
    const db = JSON.parse(localStorage.getItem(KEY));
    if (db) return db;
  } catch { /* storage unavailable or corrupt: start fresh */ }
  const db = {
    rooms: seedRooms.map((r) => ({ ...r, _id: id(), isActive: true })),
    users: [{ _id: 'admin', name: 'Admin', email: 'admin@saakshistays.test', password: 'admin123', role: 'admin' }],
    bookings: [],
  };
  save(db);
  return db;
}
function save(db) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } }

const fail = (message) => { throw new Error(message); };
const parse = (s) => (/^\d{4}-\d{2}-\d{2}$/.test(s || '') ? new Date(`${s}T00:00:00Z`) : null);
function validateStay(inS, outS) {
  const a = parse(inS), b = parse(outS);
  if (!a || !b) fail('Please choose check-in and check-out dates');
  const now = new Date();
  if (a.getTime() < Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())) fail('Check-in cannot be in the past');
  const nights = Math.round((b - a) / DAY);
  if (nights < 1) fail('Check-out must be after check-in');
  if (nights > 30) fail('Stays are limited to 30 nights');
  return { a, b, nights };
}
const overlapping = (db, roomId, a, b) => db.bookings.filter((x) =>
  x.room === roomId && x.status === 'confirmed' && new Date(x.checkIn) < b && new Date(x.checkOut) > a).length;

function currentUser(db) {
  const uid = localStorage.getItem('token');
  return db.users.find((u) => u._id === uid) || fail('Please log in');
}
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });
const withRoom = (db, b) => ({ ...b, room: db.rooms.find((r) => r._id === b.room) });

export async function register({ name, email, password }) {
  await wait(); const db = load();
  if (!name || !email || !password) fail('Name, email and password are required');
  if (password.length < 6) fail('Password must be at least 6 characters');
  if (db.users.some((u) => u.email === email.toLowerCase())) fail('Email is already registered');
  const user = { _id: id(), name, email: email.toLowerCase(), password, role: 'guest' };
  db.users.push(user); save(db);
  return { token: user._id, user: pub(user) };
}
export async function login({ email, password }) {
  await wait(); const db = load();
  const user = db.users.find((u) => u.email === String(email).toLowerCase() && u.password === password);
  if (!user) fail('Wrong email or password');
  return { token: user._id, user: pub(user) };
}
export async function me() { const db = load(); return { user: pub(currentUser(db)) }; }

export async function getRooms({ checkIn, checkOut, guests, type } = {}) {
  await wait(); const db = load();
  let rooms = db.rooms.filter((r) => r.isActive && (!type || r.type === type) && (!guests || r.capacity >= Number(guests)));
  rooms = rooms.sort((x, y) => x.pricePerNight - y.pricePerNight);
  if (checkIn && checkOut) {
    const { a, b, nights } = validateStay(checkIn, checkOut);
    rooms = rooms.map((r) => ({ ...r, available: Math.max(r.quantity - overlapping(db, r._id, a, b), 0), nights, totalPrice: r.pricePerNight * nights }));
  }
  return { rooms };
}
export async function getRoom(roomId) {
  await wait(120); const room = load().rooms.find((r) => r._id === roomId && r.isActive);
  return room ? { room } : fail('Room not found');
}
export async function createBooking({ roomId, checkIn, checkOut, guests }) {
  await wait(); const db = load(); const user = currentUser(db);
  const { a, b, nights } = validateStay(checkIn, checkOut);
  const room = db.rooms.find((r) => r._id === roomId) || fail('Room not found');
  if (guests > room.capacity) fail(`This room fits up to ${room.capacity} guests`);
  if (overlapping(db, room._id, a, b) >= room.quantity) fail('Sorry, this room is sold out for those dates');
  const booking = { _id: id(), user: user._id, room: room._id, checkIn: a.toISOString(), checkOut: b.toISOString(),
    guests: Number(guests), nights, totalPrice: room.pricePerNight * nights, status: 'confirmed', createdAt: new Date().toISOString() };
  db.bookings.push(booking); save(db);
  return { booking: withRoom(db, booking) };
}
export async function myBookings() {
  await wait(); const db = load(); const user = currentUser(db);
  return { bookings: db.bookings.filter((b) => b.user === user._id).map((b) => withRoom(db, b)).sort((x, y) => y.checkIn.localeCompare(x.checkIn)) };
}
export async function cancelBooking(bookingId) {
  await wait(); const db = load(); const user = currentUser(db);
  const b = db.bookings.find((x) => x._id === bookingId) || fail('Booking not found');
  if (b.user !== user._id && user.role !== 'admin') fail('Not your booking');
  if (b.status === 'cancelled') fail('Already cancelled');
  if (new Date(b.checkIn) <= new Date()) fail('Stays that have started cannot be cancelled');
  b.status = 'cancelled'; save(db);
  return { booking: withRoom(db, b) };
}
export async function allBookings() {
  await wait(); const db = load(); if (currentUser(db).role !== 'admin') fail('Admins only');
  return { bookings: db.bookings.map((b) => ({ ...withRoom(db, b), user: pub(db.users.find((u) => u._id === b.user)) }))
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt)) };
}
export async function createRoom(body) {
  await wait(); const db = load(); if (currentUser(db).role !== 'admin') fail('Admins only');
  const room = { ...body, _id: id(), isActive: true }; db.rooms.push(room); save(db); return { room };
}
export async function deleteRoom(roomId) {
  await wait(); const db = load(); if (currentUser(db).role !== 'admin') fail('Admins only');
  const r = db.rooms.find((x) => x._id === roomId) || fail('Room not found'); r.isActive = false; save(db);
  return { message: 'Room removed' };
}
