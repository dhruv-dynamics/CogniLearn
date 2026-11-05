import express from "express";
import {
  markLessonComplete,
  getCourseProgress,
  getProgressOverview
} from "../controllers/progress.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

/* -------------------- MARK LESSON COMPLETE -------------------- */
// Triggered manually OR automatically when video ends
router.post(
  "/lesson/complete",
  protect,
  markLessonComplete
);

/* -------------------- GET COURSE PROGRESS -------------------- */
// Returns progress %, completed lessons, and resume info
router.get(
  "/course/:courseId",
  protect,
  getCourseProgress
);

/* -------------------- DASHBOARD OVERVIEW -------------------- */
// Provides total courses, overall progress %, last accessed course
router.get(
  "/overview",
  protect,
  getProgressOverview
);

/* -------------------- TRACK LAST ACCESSED LESSON (Resume Learning) -------------------- */
// Frontend will call this when a lesson is opened (future use)
router.post(
  "/lesson/access/:lessonId",
  protect,
  async (req, res) => {
    res.status(200).json({ message: "Lesson access recorded (to be implemented)" });
  }
);

export default router;
