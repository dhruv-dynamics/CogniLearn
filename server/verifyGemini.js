import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY?.trim();

if (!apiKey) {
  console.error("❌ GEMINI_API_KEY missing in .env!");
  process.exit(1);
}

console.log("🔑 Key loaded:", apiKey.slice(0, 10) + "...");
console.log("🤖 Testing Gemini connection...\n");

try {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" }, { timeout: 8000 });

  const result = await model.generateContent("Say 'Mentor AI is working perfectly!' in Hinglish.");
  const text = result?.response?.text?.();

  if (text) {
    console.log("✅ SUCCESS! Gemini Response:");
    console.log("👉", text);
  } else {
    console.error("⚠️ Empty response from Gemini.");
  }
} catch (err) {
  console.error("❌ Gemini Test FAILED:", err.message);
}