const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
connectDB();

// Root route
app.get('/', (req, res) => {
  res.json({ message: 'Chat App API is running' });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

// Socket.io connection
const users = {};

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Add user to online users
  socket.on('add-user', (userId) => {
    users[userId] = socket.id;
    io.emit('online-users', Object.keys(users));
  });

  // Send message
  socket.on('send-message', (data) => {
    const receiverSocketId = users[data.receiverId];
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('receive-message', data);
    }
  });

  // Typing indicator
  socket.on('typing', (data) => {
    const receiverSocketId = users[data.receiverId];
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit('typing', data);
    }
  });

  // User disconnected
  socket.on('disconnect', () => {
    for (let userId in users) {
      if (users[userId] === socket.id) {
        delete users[userId];
        break;
      }
    }
    io.emit('online-users', Object.keys(users));
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
