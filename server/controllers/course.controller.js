import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import Enrollment from "../models/Enrollment.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";

/* -------------------- CREATE COURSE -------------------- */
export const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, language, level, price } = req.body;

    if (!title || !description || !category) {
      throw new ApiError(400, "Required fields missing");
    }

    const numericPrice = price ? Number(price) : 0;

    let thumbUrl = null;
    if (req.file) {
      const normalized = req.file.path.replace(/\\/g, "/");
      const idx = normalized.indexOf("/uploads/");
      thumbUrl = idx !== -1 ? normalized.substring(idx) : req.file.path;
    } else if (req.body.thumbnail) {
      thumbUrl = req.body.thumbnail;
    }

    const course = await Course.create({
      title: title.trim(),
      description: description.trim(),
      category: category || "Web Development",
      language: language || "English",
      level: level || "Beginner",
      price: numericPrice,
      instructor: req.user._id,
      thumbnail: thumbUrl,
      isPublished: true, // ✅ AUTO-PUBLISH
    });

    res
      .status(201)
      .json(new ApiResponse(201, "Course created successfully", course));
  } catch (error) {
    console.error("🔥 POST /courses crash:", error);
    next(error);
  }
};

/* -------------------- UPDATE COURSE (INSTRUCTOR) -------------------- */
export const updateCourse = async (req, res, next) => {
  try {
    const { title, description, category, language, level, price } = req.body;

    const course = await Course.findById(req.params.courseId);
    if (!course) throw new ApiError(404, "Course not found");

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new ApiError(403, "Not allowed to update this course");
    }

    // Preserve previous publish state
    const wasPublished = course.isPublished;

    // Update only provided fields
    if (title !== undefined) course.title = title.trim();
    if (description !== undefined) course.description = description.trim();
    if (category !== undefined) course.category = category;
    if (language !== undefined) course.language = language;
    if (level !== undefined) course.level = level;
    if (price !== undefined) course.price = Number(price);

    // Thumbnail update (if new file uploaded or provided)
    if (req.file) {
      const normalized = req.file.path.replace(/\\/g, "/");
      const idx = normalized.indexOf("/uploads/");
      course.thumbnail = idx !== -1 ? normalized.substring(idx) : req.file.path;
    } else if (req.body.thumbnail !== undefined) {
      course.thumbnail = req.body.thumbnail;
    }

    // Keep publish state unchanged
    course.isPublished = wasPublished;

    await course.save();

    res
      .status(200)
      .json(new ApiResponse(200, "Course updated successfully", course));
  } catch (error) {
    next(error);
  }
};

/* -------------------- PUBLISH COURSE -------------------- */
export const publishCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) throw new ApiError(404, "Course not found");

    if (course.instructor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not allowed to publish this course");
    }

    const publishedModules = await Module.find({
      course: course._id,
      isPublished: true,
    });

    if (publishedModules.length === 0) {
      throw new ApiError(400, "Cannot publish course without a published module");
    }

    const moduleIds = publishedModules.map((m) => m._id);

    const publishedLessons = await Lesson.find({
      module: { $in: moduleIds },
      isPublished: true,
    });

    if (publishedLessons.length === 0) {
      throw new ApiError(400, "Cannot publish course without a published lesson");
    }

    course.isPublished = true;
    course.publishedAt = new Date();
    await course.save();

    res
      .status(200)
      .json(new ApiResponse(200, "Course published successfully", course));
  } catch (error) {
    next(error);
  }
};

/* -------------------- GET ALL PUBLISHED COURSES (STUDENTS) -------------------- */
export const getAllPublishedCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ isPublished: true })
      .populate("instructor", "name email")
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json(new ApiResponse(200, "Courses fetched successfully", courses));
  } catch (error) {
    next(error);
  }
};

/* -------------------- GET INSTRUCTOR COURSES -------------------- */
export const getInstructorCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    });

    res
      .status(200)
      .json(new ApiResponse(200, "Instructor courses fetched", courses));
  } catch (error) {
    next(error);
  }
};

/* -------------------- GET SINGLE COURSE (FULL VIEW) -------------------- */
export const getSingleCourse = async (req, res, next) => {
  try {
    const isStudent = req.user?.role === "student";
    const isInstructor = req.user?.role === "instructor";

    const course = await Course.findById(req.params.courseId)
      .populate("instructor", "name email");

    if (!course) throw new ApiError(404, "Course not found");
    if (isStudent && !course.isPublished) {
      throw new ApiError(403, "This course is not published yet");
    }

    let moduleFilter = { course: course._id };
    if (isStudent) moduleFilter.isPublished = true;

    const modules = await Module.find(moduleFilter).sort({ order: 1, createdAt: 1 });

    let lessonMatch = {};
    if (isStudent) {
      const isEnrolled = await Enrollment.exists({
        course: req.params.courseId,
        student: req.user._id,
      });

      lessonMatch = isEnrolled
        ? {
            isPublished: true,
            $or: [
              { isPreviewFree: true },
              {
                $and: [
                  { isPreviewFree: false },
                  { $or: [{ releaseAt: null }, { releaseAt: { $lte: new Date() } }] },
                ],
              },
            ],
          }
        : { isPublished: true, isPreviewFree: true };
    }

    const modulesWithLessons = await Promise.all(
      modules.map(async (mod) => {
        const lessons = await Lesson.find({
          module: mod._id,
          ...(isInstructor ? {} : lessonMatch),
        }).sort({ order: 1, createdAt: 1 });

        return { ...mod.toObject(), lessons };
      })
    );

    // ✅ FIX: Also fetch lessons attached directly to course (no module)
    const standaloneLessons = await Lesson.find({
      course: course._id,
      module: null,
      ...(isInstructor ? {} : lessonMatch),
    }).sort({ order: 1, createdAt: 1 });

    if (standaloneLessons.length > 0) {
      modulesWithLessons.push({
        _id: "course-content",
        title: "Course Material",
        lessons: standaloneLessons,
      });
    }

    const finalCourse = { ...course.toObject(), modules: modulesWithLessons };

    res
      .status(200)
      .json(new ApiResponse(200, "Course fetched successfully", finalCourse));
  } catch (error) {
    next(error);
  }
};

/* -------------------- DELETE COURSE (INSTRUCTOR/ADMIN) -------------------- */
export const deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) throw new ApiError(404, "Course not found");

    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      throw new ApiError(403, "Not allowed to delete this course");
    }

    // 🧹 Delete all associated modules, lessons, and enrollments
    const modules = await Module.find({ course: course._id });
    const moduleIds = modules.map(m => m._id);
    
    await Lesson.deleteMany({ module: { $in: moduleIds } });
    await Module.deleteMany({ course: course._id });
    await Enrollment.deleteMany({ course: course._id });
    
    await course.deleteOne();

    res.status(200).json(new ApiResponse(200, "Course deleted successfully", null));
  } catch (error) {
    next(error);
  }
};
