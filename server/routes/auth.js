import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
const router = Router();
const tokenFor = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'development_secret_change_me', { expiresIn: '7d' });

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must contain at least 6 characters.' });
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: 'An account with this email already exists.' });
    const user = await User.create({ name: name.trim(), email, password: await bcrypt.hash(password, 12) });
    res.status(201).json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ message: 'Could not create account.', detail: err.message }); }
});
router.post('/login', async (req, res) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password.' });
    res.json({ token: tokenFor(user), user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) { res.status(500).json({ message: 'Could not log in.', detail: err.message }); }
});
router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId).select('name email');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json({ user: { id: user._id, name: user.name, email: user.email } });
});
export default router;
