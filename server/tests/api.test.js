// End-to-end API tests against a real, temporary MongoDB (mongodb-memory-server).
// The first run downloads a MongoDB binary, so it needs internet access.
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.JWT_SECRET = 'test-secret';
const app = require('../src/app');
const Room = require('../src/models/Room');
const User = require('../src/models/User');

let mongo, guestToken, adminToken, room;

// Dates relative to today so the tests never go stale.
const day = (offset) => new Date(Date.now() + offset * 864e5).toISOString().slice(0, 10);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  room = await Room.create({ name: 'Heritage Suite', type: 'suite', pricePerNight: 8900, capacity: 3, quantity: 1 });
  await User.create({ name: 'Admin', email: 'admin@test.com', password: 'admin123', role: 'admin' });
  adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'admin123' })).body.token;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

const auth = (t) => ({ Authorization: `Bearer ${t}` });

test('register and log in', async () => {
  const reg = await request(app).post('/api/auth/register').send({ name: 'Asha', email: 'asha@test.com', password: 'secret1' });
  expect(reg.status).toBe(201);
  expect(reg.body.user.role).toBe('guest');
  const login = await request(app).post('/api/auth/login').send({ email: 'ASHA@test.com', password: 'secret1' });
  expect(login.status).toBe(200);
  guestToken = login.body.token;
  const bad = await request(app).post('/api/auth/login').send({ email: 'asha@test.com', password: 'wrong' });
  expect(bad.status).toBe(401);
});

test('cannot register as admin by sending role', async () => {
  const res = await request(app).post('/api/auth/register').send({ name: 'X', email: 'x@test.com', password: 'secret1', role: 'admin' });
  expect(res.body.user.role).toBe('guest');
});

test('booking needs login', async () => {
  const res = await request(app).post('/api/bookings').send({ roomId: room._id });
  expect(res.status).toBe(401);
});

test('book a room and see the price', async () => {
  const res = await request(app).post('/api/bookings').set(auth(guestToken))
    .send({ roomId: room._id, checkIn: day(10), checkOut: day(13), guests: 2 });
  expect(res.status).toBe(201);
  expect(res.body.booking.nights).toBe(3);
  expect(res.body.booking.totalPrice).toBe(26700);
});

test('last room cannot be double-booked for overlapping dates', async () => {
  const res = await request(app).post('/api/bookings').set(auth(guestToken))
    .send({ roomId: room._id, checkIn: day(12), checkOut: day(14), guests: 1 });
  expect(res.status).toBe(409);
});

test('back-to-back stays are allowed', async () => {
  const res = await request(app).post('/api/bookings').set(auth(guestToken))
    .send({ roomId: room._id, checkIn: day(13), checkOut: day(15), guests: 1 });
  expect(res.status).toBe(201);
});

test('search shows availability for dates', async () => {
  const res = await request(app).get(`/api/rooms?checkIn=${day(11)}&checkOut=${day(12)}`);
  expect(res.body.rooms[0].available).toBe(0);
  const free = await request(app).get(`/api/rooms?checkIn=${day(20)}&checkOut=${day(22)}`);
  expect(free.body.rooms[0].available).toBe(1);
});

test('too many guests rejected', async () => {
  const res = await request(app).post('/api/bookings').set(auth(guestToken))
    .send({ roomId: room._id, checkIn: day(30), checkOut: day(31), guests: 5 });
  expect(res.status).toBe(400);
});

test('cancelling frees the room', async () => {
  const mine = await request(app).get('/api/bookings/mine').set(auth(guestToken));
  const first = mine.body.bookings.find((b) => b.nights === 3);
  const cancel = await request(app).patch(`/api/bookings/${first._id}/cancel`).set(auth(guestToken));
  expect(cancel.body.booking.status).toBe('cancelled');
  const res = await request(app).get(`/api/rooms?checkIn=${day(11)}&checkOut=${day(12)}`);
  expect(res.body.rooms[0].available).toBe(1);
});

test('only admins can add rooms and see all bookings', async () => {
  const body = { name: 'Garden Deluxe', type: 'deluxe', pricePerNight: 4800, capacity: 2, quantity: 3 };
  expect((await request(app).post('/api/rooms').set(auth(guestToken)).send(body)).status).toBe(403);
  expect((await request(app).post('/api/rooms').set(auth(adminToken)).send(body)).status).toBe(201);
  expect((await request(app).get('/api/bookings').set(auth(guestToken))).status).toBe(403);
  expect((await request(app).get('/api/bookings').set(auth(adminToken))).body.bookings.length).toBeGreaterThan(0);
});
