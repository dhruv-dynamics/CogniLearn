import express from "express";
import {
  registerUser,
  loginUser,
  getMe
} from "../controllers/auth.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

// REGISTER (Auto login included)
router.post("/register", registerUser);

// LOGIN
router.post("/login", loginUser);

// GET CURRENT USER (used for persistent login)
router.get("/me", protect, getMe);

export default router;
