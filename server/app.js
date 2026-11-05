import express from "express";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import courseRoutes from "./routes/course.routes.js";
import moduleRoutes from "./routes/module.routes.js";
import lessonRoutes from "./routes/lesson.routes.js";
import progressRoutes from "./routes/progress.routes.js";
import enrollmentRoutes from "./routes/enrollment.routes.js";
import aiTutorRoutes from "./routes/aiTutor.routes.js";
import instructorRoutes from "./routes/instructor.routes.js";
import vaultRoutes from "./routes/vault.routes.js";
import certificateRoutes from "./routes/certificate.routes.js";

import { errorMiddleware } from "./middleware/error.middleware.js";

const app = express();

// 🌍 Performance & Security Middlewares
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/* 🖼 Serve Uploaded Images & Notes */
app.use("/uploads", express.static(path.resolve("uploads")));

// 🚀 API Routes
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/lessons", lessonRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/ai-tutor", aiTutorRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/certificates", certificateRoutes);

// ❤️ Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Backend running fast & healthy 🚀" });
});

// ❌ Global Error Handler (ALWAYS LAST)
app.use(errorMiddleware);

export default app;
