import express from "express";
import {
  enrollInCourse,
  getMyEnrollments
} from "../controllers/enrollment.controller.js";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

/* -------------------- ENROLL IN COURSE -------------------- */
// URL: POST /api/enrollments/:courseId
router.post(
  "/:courseId",                 // ✅ FIXED (was /enroll)
  protect,
  authorizeRoles("student"),    // only students can enroll
  enrollInCourse
);

/* -------------------- GET MY COURSES -------------------- */
// URL: GET /api/enrollments/my-courses
router.get(
  "/my-courses",
  protect,
  authorizeRoles("student"),
  getMyEnrollments
);

export default router;
