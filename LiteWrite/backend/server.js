import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/litewrite', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Note Schema
const noteSchema = new mongoose.Schema({
  content: { type: String, default: '' },
});

const Note = mongoose.model('Note', noteSchema);

// API Endpoint to Create or Get Notes
app.get('/api/notes/:id', async (req, res) => {
  let note = await Note.findById(req.params.id);
  if (!note) {
    note = new Note({ _id: req.params.id });
    await note.save();
  }
  res.json(note);
});

// API Endpoint to Update Notes
app.put('/api/notes/:id', async (req, res) => {
  const { content } = req.body;
  const note = await Note.findByIdAndUpdate(req.params.id, { content }, { new: true });
  res.json(note);
});

// Socket.io for Real-Time Collaboration
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('join-note', (noteId) => {
    socket.join(noteId);
  });

  socket.on('edit-note', (noteId, content) => {
    socket.to(noteId).emit('update-note', content);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start Server
const PORT = 5000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
