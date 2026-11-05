import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import express from "express";
import path from "path";
import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";

// Global process error guards — prevents server from crashing on unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("⚠️ [Process Alert] Unhandled Rejection:", err?.message || err);
});

process.on("uncaughtException", (err) => {
  console.error("⚠️ [Process Alert] Uncaught Exception:", err?.message || err);
});

// Connect database with pool optimization
connectDB();

/* 📂 Serve uploaded lesson files */
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const PORT = env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT} (IPv4 ready)`);
});

// ⏱️ Extended socket timeouts for massive/long video uploads (up to 15 minutes)
server.timeout = 15 * 60 * 1000;
server.keepAliveTimeout = 65 * 1000;
