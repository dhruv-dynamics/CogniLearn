import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load from current working directory or explicit server/.env
if (fs.existsSync(path.resolve(process.cwd(), "server/.env"))) {
  dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });
} else {
  dotenv.config();
}

export const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
};
