const mongoose = require('mongoose');

// One document per room type. `quantity` is how many identical rooms of this type the hotel has.
const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['standard', 'deluxe', 'suite', 'family'], required: true },
    description: { type: String, default: '' },
    pricePerNight: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    quantity: { type: Number, required: true, min: 1 },
    amenities: [{ type: String }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Room', roomSchema);
