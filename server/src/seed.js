// Fills the database with sample rooms and an admin account:  npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const Room = require('./models/Room');
const User = require('./models/User');
const rooms = require('./rooms.json');

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Room.deleteMany({});
  await Room.insertMany(rooms);
  if (!(await User.findOne({ email: 'admin@saakshistays.test' }))) {
    await User.create({ name: 'Admin', email: 'admin@saakshistays.test', password: 'admin123', role: 'admin' });
  }
  console.log(`Seeded ${rooms.length} rooms. Admin login: admin@saakshistays.test / admin123`);
  await mongoose.disconnect();
})();
