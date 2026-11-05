import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";

// 🎓 Enroll student in a course
export const enrollInCourse = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { courseId } = req.params; // ✅ FIXED: get from URL param

    const course = await Course.findById(courseId);
    if (!course || !course.isPublished) {
      return res.status(404).json({ message: "Course not available for enrollment" });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      isActive: true,
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: "Already enrolled in this course" });
    }

    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
      isActive: true,
    });

    res.status(201).json({
      message: "Successfully enrolled 🎉",
      enrollment,
    });
  } catch (error) {
    console.error("Enrollment Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// 📚 Get all active enrolled courses for logged-in student
export const getMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user._id;

    const enrollments = await Enrollment.find({
      student: studentId,
      isActive: true,
    }).populate("course", "title description level thumbnail");

    const courses = enrollments.map(e => e.course);

    res.status(200).json({
      message: "Enrolled courses fetched",
      data: courses, // ✅ matches frontend usage
    });
  } catch (error) {
    console.error("Fetch Enrollments Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
