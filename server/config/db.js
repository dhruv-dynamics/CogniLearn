import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(env.MONGO_URI, {
      maxPoolSize: 20, // Maintain up to 20 socket connections for concurrency
      minPoolSize: 5,  // Keep at least 5 sockets open to eliminate handshake latency
      serverSelectionTimeoutMS: 5000, // Fail-fast after 5 seconds instead of hanging
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};
