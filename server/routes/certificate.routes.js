import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import Certificate from "../models/Certificate.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// Configure multer for certificate uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/certificates";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, and PDF files are allowed"), false);
    }
  }
});

// Upload certificate
router.post("/upload", protect, upload.single("certificate"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded"
      });
    }

    const { title, description, issuedBy, expiryDate } = req.body;

    const certificate = new Certificate({
      student: req.user._id,
      title,
      description,
      issuedBy,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      fileUrl: `/uploads/certificates/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    await certificate.save();

    res.status(201).json({
      success: true,
      certificate,
      message: "Certificate uploaded successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to upload certificate",
      error: error.message
    });
  }
});

// Delete certificate
router.delete("/:certificateId", protect, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.certificateId,
      student: req.user._id
    });

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: "Certificate not found"
      });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), certificate.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Certificate.findByIdAndDelete(req.params.certificateId);

    res.json({
      success: true,
      message: "Certificate deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete certificate",
      error: error.message
    });
  }
});

export default router;
