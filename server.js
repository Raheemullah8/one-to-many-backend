// server.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

// Load env only in local
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const connectDB = require("./config/db");

const app = express();
const server = http.createServer(app);

/* =======================
   Middleware
======================= */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =======================
   Health Check (Koyeb)
======================= */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* =======================
   Routes
======================= */
app.get("/", (req, res) => {
  res.json({ message: "Chat App API is running" });
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

/* =======================
   Socket.io Setup
======================= */
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("send-message", (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("receive-message", data);
    }
  });

  socket.on("typing", (data) => {
    const receiverSocketId = onlineUsers.get(data.receiverId);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("typing", data);
    }
  });

  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

/* =======================
   Server Start
======================= */
const PORT = process.env.PORT || 8000;

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Connect DB AFTER server starts (Koyeb safe)
  try {
    await connectDB();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
  }
});
