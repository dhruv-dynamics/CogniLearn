import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const protect = async (req, res, next) => {
  let token;

  console.log("👉 AUTH HEADER RECEIVED:", req.headers.authorization);

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ApiError(401, "Not authorized, token missing"));
  }

  try {
    console.log("🔐 USING JWT SECRET:", env.JWT_SECRET); // NEW
    const decoded = jwt.verify(token, env.JWT_SECRET);
    console.log("✅ DECODED TOKEN:", decoded); // NEW

    req.user = await User.findById(decoded.id).select("-password");

    if (!req.user) {
      return next(new ApiError(401, "User no longer exists"));
    }

    next();
  } catch (error) {
    console.log("❌ JWT VERIFY ERROR:", error.message); // NEW
    next(new ApiError(401, "Invalid or expired token"));
  }
};
