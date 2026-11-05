import express from "express";
import {
  createModule,
  updateModule,
  publishModule,
  getModulesByCourse,
  deleteModule,
} from "../controllers/module.controller.js";

import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";

const router = express.Router();

/* -------------------- CREATE MODULE -------------------- */
router.post(
  "/",
  protect,
  authorizeRoles("instructor", "admin"),
  createModule
);

/* -------------------- UPDATE MODULE -------------------- */
router.patch(
  "/:moduleId",
  protect,
  authorizeRoles("instructor", "admin"),
  updateModule
);

router.put(
  "/:moduleId",
  protect,
  authorizeRoles("instructor", "admin"),
  updateModule
);

/* -------------------- DELETE MODULE -------------------- */
router.delete(
  "/:moduleId",
  protect,
  authorizeRoles("instructor", "admin"),
  deleteModule
);

/* -------------------- PUBLISH MODULE -------------------- */
router.patch(
  "/:moduleId/publish",
  protect,
  authorizeRoles("instructor", "admin"),
  publishModule
);

/* -------------------- GET MODULES BY COURSE -------------------- */
router.get(
  "/course/:courseId",
  protect,
  getModulesByCourse
);

export default router;
