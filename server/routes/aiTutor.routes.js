import express from "express";
import {
  askAiTutor,
  getAiHistory,
  deleteAiDoubt,
  clearAiHistory,
} from "../controllers/aiTutor.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { uploadLessonFiles } from "../middleware/upload.middleware.js";

const router = express.Router();

// Ask Mentor AI (Supports text and optional image upload)
router.post("/ask", protect, uploadLessonFiles.single("image"), askAiTutor);

// Fetch chat history
router.get("/history", protect, getAiHistory);

// Delete single chat doubt
router.delete("/history/:doubtId", protect, deleteAiDoubt);

// Clear entire chat history for student
router.delete("/history", protect, clearAiHistory);

export default router;
