import mongoose from 'mongoose';
const taskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  subject: { type: String, default: 'General', trim: true, maxlength: 80 },
  description: { type: String, default: '', maxlength: 2000 },
  dueDate: { type: Date, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  status: { type: String, enum: ['To do', 'In progress', 'Completed'], default: 'To do' }
}, { timestamps: true });
export default mongoose.model('Task', taskSchema);
