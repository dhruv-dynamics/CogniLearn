import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import Enrollment from "../models/Enrollment.js";
import { ApiError } from "../utils/ApiError.js";

export const checkLessonAccess = async (req, res, next) => {
  try {
    const lessonId = req.params.lessonId;

    const lesson = await Lesson.findById(lessonId)
      .populate({
        path: "module",
        populate: { path: "course" }
      })
      .populate("course");

    if (!lesson) {
      throw new ApiError(404, "Lesson not found");
    }

    const course = lesson.module?.course || lesson.course;

    if (!course) {
      throw new ApiError(400, "Lesson must belong to a course or module");
    }

    // Instructors who own the course → always allowed
    if (req.user.role === "instructor" &&
        course.instructor.toString() === req.user._id.toString()) {
      req.lesson = lesson;
      return next();
    }

    // Preview lessons → allowed to all logged-in users
    if (lesson.isPublished && lesson.isPreviewFree) {
      req.lesson = lesson;
      return next();
    }

    // Students must be enrolled
    if (req.user.role === "student") {
      const isEnrolled = await Enrollment.exists({
        course: course._id,
        student: req.user._id
      });

      if (!isEnrolled) {
        throw new ApiError(403, "You must enroll to access this lesson");
      }

      // Also ensure lesson is released
      if (lesson.releaseAt && lesson.releaseAt > new Date()) {
        throw new ApiError(403, "This lesson is not yet released");
      }

      req.lesson = lesson;
      return next();
    }

    throw new ApiError(403, "Access denied");
  } catch (error) {
    next(error);
  }
};
