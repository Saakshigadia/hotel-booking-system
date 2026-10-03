const router = require('express').Router();
const User = require('../models/User');
const { signToken, protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

router.post('/register', asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
  if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const user = await User.create({ name, email, password }); // role always defaults to guest
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
}));

router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
  if (!user || !(await user.checkPassword(password || ''))) {
    return res.status(401).json({ message: 'Wrong email or password' });
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', protect, (req, res) => res.json({ user: publicUser(req.user) }));

module.exports = router;
