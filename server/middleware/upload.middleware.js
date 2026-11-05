import multer from "multer";
import path from "path";
import fs from "fs";

/* -------------------------------------------------- */
/* 🗂️ ENSURE LOCAL UPLOAD DIRECTORIES EXIST          */
/* -------------------------------------------------- */
const uploadDirs = ["uploads", "uploads/videos", "uploads/notes", "uploads/images"];
uploadDirs.forEach((dir) => {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

/* -------------------------------------------------- */
/* 💾 HIGH-CAPACITY DISK STORAGE ENGINE               */
/* Supports long videos (up to 2GB) without Cloudinary*/
/* 100MB free-tier limits or quota exhaustion.        */
/* -------------------------------------------------- */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith("video")) {
      cb(null, path.join(process.cwd(), "uploads/videos"));
    } else if (
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf")
    ) {
      cb(null, path.join(process.cwd(), "uploads/notes"));
    } else {
      cb(null, path.join(process.cwd(), "uploads/images"));
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const cleanName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "-");
    cb(null, `${cleanName}-${Date.now()}${ext}`);
  },
});

/* -------------------------------------------------- */
/* 🔒 FILE FILTER                                     */
/* -------------------------------------------------- */
const fileFilter = (req, file, cb) => {
  const imageTypes = /jpeg|jpg|png|webp/;
  const isImage =
    imageTypes.test(path.extname(file.originalname).toLowerCase()) &&
    imageTypes.test(file.mimetype);

  const isPDF =
    file.mimetype === "application/pdf" ||
    file.originalname.toLowerCase().endsWith(".pdf");

  const isVideo = file.mimetype.startsWith("video");

  if (isImage || isPDF || isVideo) {
    cb(null, true);
  } else {
    cb(new Error("Only video (MP4/WebM), PDF, and image files are allowed"), false);
  }
};

/* -------------------------------------------------- */
/* 🚀 UPLOAD CONFIG (UP TO 2GB PER FILE)              */
/* -------------------------------------------------- */
export const uploadLessonFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2048 * 1024 * 1024, // 2GB limit — handles full multi-hour lectures!
  },
});
