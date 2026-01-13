const mongoose = require("mongoose");

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.log("⚠️ MONGODB_URI missing, skipping DB connection");
    return;
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connected");
};

module.exports = connectDB;
