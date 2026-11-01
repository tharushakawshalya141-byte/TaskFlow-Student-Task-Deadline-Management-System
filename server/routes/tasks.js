import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import auth from '../middleware/auth.js';
const router = Router();
router.use(auth);

router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.userId }).sort({ dueDate: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) { res.status(500).json({ message: 'Could not load tasks.', detail: err.message }); }
});
router.post('/', async (req, res) => {
  try {
    const { title, dueDate, subject, description, priority, status } = req.body;
    if (!title?.trim() || !dueDate) return res.status(400).json({ message: 'Task title and deadline are required.' });
    const task = await Task.create({ user: req.userId, title: title.trim(), dueDate, subject, description, priority, status });
    res.status(201).json(task);
  } catch (err) { res.status(400).json({ message: 'Could not create task.', detail: err.message }); }
});
router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task ID.' });
  const task = await Task.findOne({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  res.json(task);
});
router.put('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task ID.' });
  try {
    const allowed = ['title', 'subject', 'description', 'dueDate', 'priority', 'status'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, updates, { new: true, runValidators: true });
    if (!task) return res.status(404).json({ message: 'Task not found.' });
    res.json(task);
  } catch (err) { res.status(400).json({ message: 'Could not update task.', detail: err.message }); }
});
router.delete('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: 'Invalid task ID.' });
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
  if (!task) return res.status(404).json({ message: 'Task not found.' });
  res.json({ message: 'Task deleted.' });
});
export default router;
