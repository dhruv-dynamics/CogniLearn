import express from "express";
import {
  createLesson,
  publishLesson,
  getLessonsByModule,
  getStandaloneLessons,
  updateLesson,
  deleteLesson,
  reorderLessons
} from "../controllers/lesson.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { checkLessonAccess } from "../middleware/checkLessonAccess.js";
import { uploadLessonFiles } from "../middleware/upload.middleware.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const router = express.Router();

/* -------------------- CREATE LESSON -------------------- */
router.post(
  "/",
  protect,
  authorizeRoles("instructor", "admin"),
  uploadLessonFiles.fields([
    { name: "video", maxCount: 1 },
    { name: "notes", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  createLesson
);

/* -------------------- UPDATE LESSON -------------------- */
router.patch(
  "/:lessonId",
  protect,
  authorizeRoles("instructor", "admin"),
  uploadLessonFiles.fields([
    { name: "video", maxCount: 1 },
    { name: "notes", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  updateLesson
);

/* -------------------- DELETE LESSON -------------------- */
router.delete(
  "/:lessonId",
  protect,
  authorizeRoles("instructor", "admin"),
  deleteLesson
);

/* -------------------- REORDER LESSONS -------------------- */
router.patch(
  "/reorder",
  protect,
  authorizeRoles("instructor", "admin"),
  reorderLessons
);

/* -------------------- PUBLISH LESSON -------------------- */
router.patch(
  "/:lessonId/publish",
  protect,
  authorizeRoles("instructor", "admin"),
  publishLesson
);

/* -------------------- GET LESSONS BY MODULE -------------------- */
router.get(
  "/module/:moduleId",
  protect,
  getLessonsByModule
);

/* -------------------- GET STANDALONE LESSONS -------------------- */
router.get(
  "/standalone",
  protect,
  getStandaloneLessons
);

/* -------------------- SECURE LESSON CONTENT -------------------- */
router.get(
  "/:lessonId/content",
  protect,
  checkLessonAccess,
  (req, res) => {
    res.json(
      new ApiResponse(200, "Lesson content fetched", {
        _id: req.lesson._id,
        title: req.lesson.title,
        contentType: req.lesson.contentType,
        videoUrl: req.lesson.videoUrl,
        textContent: req.lesson.textContent,
        duration: req.lesson.duration,
        notesUrl: req.lesson.notesUrl,
        thumbnail: req.lesson.thumbnail
      })
    );
  }
);

export default router;
