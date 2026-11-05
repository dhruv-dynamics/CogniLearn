import express from "express";
import {
  createCourse,
  updateCourse,
  getInstructorCourses,
  getSingleCourse,
  getAllPublishedCourses,
  publishCourse,
  deleteCourse,
} from "../controllers/course.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { uploadLessonFiles as upload } from "../middleware/upload.middleware.js";

const router = express.Router();

/* -------------------- GET ALL PUBLISHED COURSES (STUDENTS) -------------------- */
router.get(
  "/",
  protect,
  getAllPublishedCourses
);

/* -------------------- CREATE COURSE -------------------- */
// Instructor/Admin create course (starts as draft)
router.post(
  "/",
  protect,
  authorizeRoles("instructor", "admin"),
  upload.single("thumbnail"),
  createCourse
);

/* -------------------- UPDATE COURSE (PUT / PATCH) -------------------- */
// Instructor/Admin update course details
router.put(
  "/:courseId",
  protect,
  authorizeRoles("instructor", "admin"),
  upload.single("thumbnail"),   // allow thumbnail replacement
  updateCourse
);

router.patch(
  "/:courseId",
  protect,
  authorizeRoles("instructor", "admin"),
  upload.single("thumbnail"),   // allow thumbnail replacement
  updateCourse
);

/* -------------------- GET INSTRUCTOR COURSES -------------------- */
router.get(
  "/instructor",
  protect,
  authorizeRoles("instructor", "admin"),
  getInstructorCourses
);

/* -------------------- PUBLISH COURSE -------------------- */
router.patch(
  "/:courseId/publish",
  protect,
  authorizeRoles("instructor", "admin"),
  publishCourse
);

/* -------------------- GET SINGLE COURSE (WITH MODULES & LESSONS) -------------------- */
router.get(
  "/:courseId",
  protect,
  getSingleCourse
);

/* -------------------- DELETE COURSE -------------------- */
router.delete(
  "/:courseId",
  protect,
  authorizeRoles("instructor", "admin"),
  deleteCourse
);

export default router;
