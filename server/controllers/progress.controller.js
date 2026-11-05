import Progress from "../models/Progress.js";
import Lesson from "../models/Lesson.js";
import Module from "../models/Module.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";

/**
 * @desc Mark a lesson as completed (manual or auto when video ends)
 * @route POST /api/progress/lesson/complete
 * @access Private (Student)
 */
export const markLessonComplete = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId, lessonId } = req.body;

    if (!courseId || !lessonId) {
      return res.status(400).json({ message: "Course ID and Lesson ID are required" });
    }

    const lesson = await Lesson.findById(lessonId).populate({
      path: "module",
      populate: { path: "course" }
    });

    if (!lesson) return res.status(404).json({ message: "Lesson not found" });

    if (lesson.module.course._id.toString() !== courseId) {
      return res.status(400).json({ message: "Lesson does not belong to this course" });
    }

    // Allow ANY lesson to be marked as completed

    if (!lesson.isPublished) {
      return res.status(403).json({ message: "Lesson is not available" });
    }

    if (lesson.releaseAt && lesson.releaseAt > new Date()) {
      return res.status(403).json({ message: "Lesson not yet released" });
    }

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      isActive: true,
    });

    if (!enrollment) {
      return res.status(403).json({
        message: "You must enroll in this course before tracking progress",
      });
    }

    let progress = await Progress.findOne({ student: studentId, course: courseId });

    if (!progress) {
      progress = new Progress({
        student: studentId,
        course: courseId,
        completedLessons: [],
      });
    }

    if (!progress.isLessonCompleted(lessonId)) {
      progress.completedLessons.push({ lesson: lessonId });
    }

    progress.lastAccessedLesson = lessonId;
    progress.lastAccessedAt = new Date();

    const modules = await Module.find({ course: courseId }).select("_id");
    const moduleIds = modules.map(m => m._id);
    const totalLessons = await Lesson.countDocuments({ module: { $in: moduleIds } });

    progress.calculateCompletion(totalLessons);

    await progress.save();

    res.status(200).json({
      message: "Lesson marked as completed",
      progress,
    });
  } catch (error) {
    console.error("Mark Lesson Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * @desc Get progress for a specific course
 * @route GET /api/progress/course/:courseId
 * @access Private (Student)
 */
export const getCourseProgress = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { courseId } = req.params;

    const progress = await Progress.findOne({
      student: studentId,
      course: courseId,
    })
      .populate("completedLessons.lesson", "title")
      .populate("lastAccessedLesson", "title");

    if (!progress) {
      return res.status(200).json({
        message: "No progress yet",
        progress: {
          completedLessons: [],
          completionPercentage: 0,
          lastAccessedLesson: null,
        },
      });
    }

    res.status(200).json(progress);
  } catch (error) {
    console.error("Get Progress Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * 🆕 @desc Get student dashboard overview
 * @route GET /api/progress/overview
 * @access Private (Student)
 */
export const getProgressOverview = async (req, res) => {
  try {
    const studentId = req.user.id;

    const enrollments = await Enrollment.find({ student: studentId, isActive: true });
    const totalCourses = enrollments.length;

    const progresses = await Progress.find({ student: studentId });

    let overallProgress = 0;
    if (progresses.length > 0) {
      const total = progresses.reduce((sum, p) => sum + (p.completionPercentage || 0), 0);
      overallProgress = Math.round(total / progresses.length);
    }

    let lastCourse = null;
    if (progresses.length > 0) {
      const latest = progresses.sort(
        (a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt)
      )[0];

      lastCourse = await Course.findById(latest.course).select("title");
    }

    res.status(200).json({
      totalCourses,
      overallProgress,
      lastCourse,
    });
  } catch (error) {
    console.error("Overview Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
