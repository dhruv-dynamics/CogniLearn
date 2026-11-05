import Course from "../models/Course.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";

export const checkAndUpdateCoursePublishStatus = async (courseId) => {
  // Find published modules
  const publishedModules = await Module.find({
    course: courseId,
    isPublished: true
  });

  if (publishedModules.length === 0) {
    await Course.findByIdAndUpdate(courseId, {
      isPublished: false,
      publishedAt: null
    });
    return;
  }

  const moduleIds = publishedModules.map(m => m._id);

  const publishedLessons = await Lesson.find({
    module: { $in: moduleIds },
    isPublished: true
  });

  if (publishedLessons.length === 0) {
    await Course.findByIdAndUpdate(courseId, {
      isPublished: false,
      publishedAt: null
    });
  }
};
