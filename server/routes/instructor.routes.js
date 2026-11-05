import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import {
  getInstructorDashboard,
  getAiAnalytics,
  getLearners,
  revokeLearnerAccess,
  toggleCoursePublish,
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
} from "../controllers/instructor.controller.js";

const router = express.Router();

router.get(
  "/dashboard",
  protect,
  authorizeRoles("instructor"),
  getInstructorDashboard
);

router.patch(
  "/courses/:courseId/toggle-publish",
  protect,
  authorizeRoles("instructor"),
  toggleCoursePublish
);

router.post(
  "/announcements",
  protect,
  authorizeRoles("instructor"),
  createAnnouncement
);

router.get(
  "/announcements",
  protect,
  authorizeRoles("instructor"),
  getAnnouncements
);

router.delete(
  "/announcements/:id",
  protect,
  authorizeRoles("instructor"),
  deleteAnnouncement
);

router.get(
  "/ai-analytics",
  protect,
  authorizeRoles("instructor"),
  getAiAnalytics
);

router.get(
  "/learners",
  protect,
  authorizeRoles("instructor"),
  getLearners
);

router.delete(
  "/learners/:enrollmentId",
  protect,
  authorizeRoles("instructor"),
  revokeLearnerAccess
);

export default router;
