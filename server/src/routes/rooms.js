const router = require('express').Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { validateStay } = require('../utils/booking');

// How many rooms of this type are already booked for any night in [checkIn, checkOut).
function countOverlapping(roomId, checkIn, checkOut) {
  return Booking.countDocuments({
    room: roomId, status: 'confirmed', checkIn: { $lt: checkOut }, checkOut: { $gt: checkIn },
  });
}

// GET /api/rooms?checkIn=2026-12-20&checkOut=2026-12-23&guests=2&type=deluxe&maxPrice=6000
router.get('/', asyncHandler(async (req, res) => {
  const { checkIn, checkOut, guests, type, maxPrice } = req.query;
  const filter = { isActive: true };
  if (type) filter.type = type;
  if (guests) filter.capacity = { $gte: Number(guests) };
  if (maxPrice) filter.pricePerNight = { $lte: Number(maxPrice) };
  const rooms = await Room.find(filter).sort({ pricePerNight: 1 }).lean();

  if (!checkIn || !checkOut) return res.json({ rooms });
  const stay = validateStay(checkIn, checkOut);
  if (stay.error) return res.status(400).json({ message: stay.error });
  const withAvailability = await Promise.all(rooms.map(async (r) => {
    const booked = await countOverlapping(r._id, stay.checkIn, stay.checkOut);
    return { ...r, available: Math.max(r.quantity - booked, 0), nights: stay.nights, totalPrice: r.pricePerNight * stay.nights };
  }));
  res.json({ rooms: withAvailability });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room || !room.isActive) return res.status(404).json({ message: 'Room not found' });
  res.json({ room });
}));

// ----- admin -----
router.post('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);
  res.status(201).json({ room });
}));

router.put('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json({ room });
}));

// Soft delete so old bookings still point at a real room.
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!room) return res.status(404).json({ message: 'Room not found' });
  res.json({ message: 'Room removed' });
}));

module.exports = { router, countOverlapping };
