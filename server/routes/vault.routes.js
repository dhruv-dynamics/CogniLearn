import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { authorizeRoles } from "../middleware/role.middleware.js";
import { uploadLessonFiles as upload } from "../middleware/upload.middleware.js"; // Reuse the uploader config

import {
  getVaultItems,
  createNote,
  updateNote,
  uploadFile,
  deleteItem,
} from "../controllers/vault.controller.js";

const router = express.Router();

router.use(protect); // Ensure user is authenticated
router.use(authorizeRoles("student")); // Ensure user is a student

// Fetch all items (Notes and Files)
router.get("/", getVaultItems);

// Notes CRUD
router.post("/note", createNote);
router.put("/note/:id", updateNote);

// File Upload
router.post("/file", upload.single("file"), uploadFile);

// Delete an item (Note or File)
router.delete("/:id", deleteItem);

export default router;
