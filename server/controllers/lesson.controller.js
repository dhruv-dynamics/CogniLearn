import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import Course from "../models/Course.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/* =========================================================
   HELPER FUNCTION
========================================================= */
const getFileUrl = (file) => {
  if (!file) return null;

  // Cloudinary URL
  if (file.secure_url) return file.secure_url;

  // Multer local path -> Normalize Windows backslashes to web URL
  if (file.path) {
    const normalized = file.path.replace(/\\/g, "/");
    const idx = normalized.indexOf("/uploads/");
    if (idx !== -1) {
      return normalized.substring(idx);
    }
    const idx2 = normalized.indexOf("uploads/");
    if (idx2 !== -1) {
      return "/" + normalized.substring(idx2);
    }
    return file.path;
  }

  return null;
};

/* =========================================================
   CREATE LESSON
========================================================= */
export const createLesson = async (req, res, next) => {
  try {
    const {
      title,
      moduleId,
      courseId,
      contentType,
      textContent,
      order,
      duration,
      releaseAt,
      isPreviewFree,
    } = req.body;

    if (!title) {
      throw new ApiError(400, "Title is required");
    }

    const instructorId = req.user._id;

    /* ---------- Module Check ---------- */
    if (moduleId) {
      const module = await Module.findById(moduleId).populate("course");

      if (!module) throw new ApiError(404, "Module not found");

      if (module.course.instructor.toString() !== instructorId.toString()) {
        throw new ApiError(403, "Not allowed to add lesson");
      }
    }

    /* ---------- Course Check ---------- */
    if (!moduleId && courseId) {
      const course = await Course.findById(courseId);

      if (!course) throw new ApiError(404, "Course not found");

      if (course.instructor.toString() !== instructorId.toString()) {
        throw new ApiError(403, "Not allowed to add lesson");
      }
    }

    /* ---------- File Upload or Direct URL ---------- */
    const videoUrl = getFileUrl(req.files?.video?.[0]) || req.body.videoUrl || null;
    const notesUrl = getFileUrl(req.files?.notes?.[0]) || req.body.notesUrl || null;
    const thumbnail = getFileUrl(req.files?.thumbnail?.[0]) || req.body.thumbnail || null;

    let determinedContentType = contentType || "video";
    if (!contentType) {
      if (videoUrl) determinedContentType = "video";
      else if (notesUrl) determinedContentType = "pdf";
      else determinedContentType = "text";
    }

    // Auto-calculate sequential order if not provided
    let calculatedOrder =
      order !== undefined && order !== null && order !== ""
        ? Number(order)
        : undefined;
    if (calculatedOrder === undefined) {
      if (moduleId) {
        const count = await Lesson.countDocuments({ module: moduleId });
        calculatedOrder = count + 1;
      } else if (courseId) {
        const count = await Lesson.countDocuments({
          course: courseId,
          module: null,
        });
        calculatedOrder = count + 1;
      } else {
        calculatedOrder = 1;
      }
    }

    const lesson = await Lesson.create({
      title: title.trim(),
      module: moduleId || null,
      course: courseId || null,
      instructor: instructorId,
      contentType: determinedContentType,
      textContent: textContent || null,
      videoUrl,
      notesUrl,
      thumbnail,
      order: calculatedOrder,
      duration: duration ? Number(duration) : null,
      releaseAt: releaseAt || null,
      isPreviewFree: isPreviewFree === "true" || isPreviewFree === true,
      isPublished: true,
    });

    res
      .status(201)
      .json(new ApiResponse(201, "Lesson created successfully", lesson));
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UPDATE LESSON
========================================================= */
export const updateLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId)
      .populate({ path: "module", populate: { path: "course" } })
      .populate("course");

    if (!lesson) throw new ApiError(404, "Lesson not found");

    const ownerId =
      lesson.module?.course?.instructor ||
      lesson.course?.instructor ||
      lesson.instructor;

    if (ownerId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not allowed to update lesson");
    }

    const {
      title,
      duration,
      textContent,
      releaseAt,
      isPreviewFree,
      order,
      contentType,
    } = req.body;

    if (title) lesson.title = title.trim();
    if (duration !== undefined) lesson.duration = Number(duration);
    if (order !== undefined) lesson.order = Number(order);
    if (contentType) lesson.contentType = contentType;
    if (textContent !== undefined) lesson.textContent = textContent;

    if (releaseAt !== undefined) lesson.releaseAt = releaseAt;
    if (isPreviewFree !== undefined) {
      lesson.isPreviewFree = isPreviewFree === "true" || isPreviewFree === true;
    }

    /* ---------- File or URL Update ---------- */
    if (req.files?.video) {
      lesson.videoUrl = getFileUrl(req.files.video[0]);
    } else if (req.body.videoUrl !== undefined) {
      lesson.videoUrl = req.body.videoUrl;
    }

    if (req.files?.notes) {
      lesson.notesUrl = getFileUrl(req.files.notes[0]);
    } else if (req.body.notesUrl !== undefined) {
      lesson.notesUrl = req.body.notesUrl;
    }

    if (req.files?.thumbnail) {
      lesson.thumbnail = getFileUrl(req.files.thumbnail[0]);
    } else if (req.body.thumbnail !== undefined) {
      lesson.thumbnail = req.body.thumbnail;
    }

    await lesson.save();

    res
      .status(200)
      .json(new ApiResponse(200, "Lesson updated successfully", lesson));
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   DELETE LESSON
========================================================= */
export const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId)
      .populate({ path: "module", populate: { path: "course" } })
      .populate("course");

    if (!lesson) throw new ApiError(404, "Lesson not found");

    const ownerId =
      lesson.module?.course?.instructor ||
      lesson.course?.instructor ||
      lesson.instructor;

    if (ownerId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not allowed to delete lesson");
    }

    await lesson.deleteOne();

    res
      .status(200)
      .json(new ApiResponse(200, "Lesson deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   REORDER LESSONS
========================================================= */
export const reorderLessons = async (req, res, next) => {
  try {
    const { lessons } = req.body;

    if (!Array.isArray(lessons)) {
      throw new ApiError(400, "Lessons array is required");
    }

    const bulkOps = lessons.map((item, index) => ({
      updateOne: {
        filter: { _id: item._id },
        update: { order: index + 1 },
      },
    }));

    await Lesson.bulkWrite(bulkOps);

    res
      .status(200)
      .json(new ApiResponse(200, "Lessons reordered successfully"));
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   PUBLISH LESSON
========================================================= */
export const publishLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId)
      .populate({ path: "module", populate: { path: "course" } })
      .populate("course");

    if (!lesson) throw new ApiError(404, "Lesson not found");

    const ownerId =
      lesson.module?.course?.instructor ||
      lesson.course?.instructor ||
      lesson.instructor;

    if (ownerId.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not allowed to publish lesson");
    }

    lesson.isPublished = true;
    lesson.publishedAt = new Date();
    await lesson.save();

    res
      .status(200)
      .json(new ApiResponse(200, "Lesson published successfully", lesson));
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET LESSONS BY MODULE
========================================================= */
export const getLessonsByModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const lessons = await Lesson.find({
      module: moduleId,
      isPublished: true,
    }).sort({ order: 1, createdAt: 1 });

    res
      .status(200)
      .json(new ApiResponse(200, "Lessons fetched successfully", lessons));
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET STANDALONE LESSONS
========================================================= */
export const getStandaloneLessons = async (req, res, next) => {
  try {
    const lessons = await Lesson.find({
      isPublished: true,
      module: null,
      course: null,
    })
      .populate("instructor", "name email")
      .sort({ order: 1, createdAt: 1 });

    res
      .status(200)
      .json(new ApiResponse(200, "Standalone lessons fetched", lessons));
  } catch (error) {
    next(error);
  }
};
