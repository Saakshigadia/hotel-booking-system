const router = require('express').Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { validateStay, totalPrice } = require('../utils/booking');
const { countOverlapping } = require('./rooms');

router.use(protect);

// POST /api/bookings  { roomId, checkIn, checkOut, guests }
router.post('/', asyncHandler(async (req, res) => {
  const { roomId, checkIn, checkOut, guests } = req.body;
  const stay = validateStay(checkIn, checkOut);
  if (stay.error) return res.status(400).json({ message: stay.error });

  const room = await Room.findById(roomId);
  if (!room || !room.isActive) return res.status(404).json({ message: 'Room not found' });
  const g = Number(guests) || 1;
  if (g > room.capacity) return res.status(400).json({ message: `This room fits up to ${room.capacity} guests` });

  if ((await countOverlapping(room._id, stay.checkIn, stay.checkOut)) >= room.quantity) {
    return res.status(409).json({ message: 'Sorry, this room is sold out for those dates' });
  }

  const booking = await Booking.create({
    user: req.user._id, room: room._id, checkIn: stay.checkIn, checkOut: stay.checkOut,
    guests: g, nights: stay.nights, totalPrice: totalPrice(room.pricePerNight, stay.nights),
  });

  // Guard against two people booking the last room at the same moment:
  // re-count after saving and undo this booking if we went over.
  if ((await countOverlapping(room._id, stay.checkIn, stay.checkOut)) > room.quantity) {
    await booking.deleteOne();
    return res.status(409).json({ message: 'Sorry, someone just booked the last room for those dates' });
  }

  res.status(201).json({ booking: await booking.populate('room', 'name type pricePerNight') });
}));

router.get('/mine', asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id }).populate('room', 'name type pricePerNight').sort({ checkIn: -1 });
  res.json({ bookings });
}));

router.patch('/:id/cancel', asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) return res.status(404).json({ message: 'Booking not found' });
  const owner = booking.user.equals(req.user._id);
  if (!owner && req.user.role !== 'admin') return res.status(403).json({ message: 'Not your booking' });
  if (booking.status === 'cancelled') return res.status(400).json({ message: 'Already cancelled' });
  if (booking.checkIn <= new Date()) return res.status(400).json({ message: 'Stays that have started cannot be cancelled' });
  booking.status = 'cancelled';
  await booking.save();
  res.json({ booking });
}));

// Admin: every booking, newest first.
router.get('/', adminOnly, asyncHandler(async (req, res) => {
  const bookings = await Booking.find().populate('room', 'name type').populate('user', 'name email').sort({ createdAt: -1 });
  res.json({ bookings });
}));

module.exports = router;
