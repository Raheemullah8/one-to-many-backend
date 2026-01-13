const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database
connectDB();

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Chat App API is running' });
});

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Socket.io
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true
  }
});

const users = {};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('add-user', (userId) => {
    users[userId] = socket.id;
    io.emit('online-users', Object.keys(users));
  });

  socket.on('send-message', (data) => {
    const receiverSocketId = users[data.receiverId];
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('receive-message', data);
    }
  });

  socket.on('typing', (data) => {
    const receiverSocketId = users[data.receiverId];
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('typing', data);
    }
  });

  socket.on('disconnect', () => {
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }
    io.emit('online-users', Object.keys(users));
  });
});

// ✅ IMPORTANT (Render requires this)
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
