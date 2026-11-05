import Course from "../models/Course.js";
import Enrollment from "../models/Enrollment.js";
import AiDoubt from "../models/AiDoubt.js";
import Progress from "../models/Progress.js";
import Announcement from "../models/Announcement.js";

/* -------------------- INSTRUCTOR DASHBOARD STATS -------------------- */
export const getInstructorDashboard = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // 📚 Total courses created by instructor
    const courses = await Course.find({ instructor: instructorId }).sort({ createdAt: -1 });
    const totalCourses = courses.length;
    const courseIds = courses.map((c) => c._id);

    // 🟢 Published vs Draft courses
    const publishedCourses = courses.filter((c) => c.isPublished).length;
    const draftCourses = totalCourses - publishedCourses;

    // 🎓 Active enrollments across instructor courses
    const enrollments = await Enrollment.find({
      course: { $in: courseIds },
      isActive: true,
    })
      .populate("student", "name email")
      .populate("course", "title price category");

    // Unique students count
    const uniqueStudentIds = new Set(
      enrollments.map((e) => e.student?._id?.toString()).filter(Boolean)
    );
    const totalStudents = uniqueStudentIds.size;
    const totalEnrollments = enrollments.length;

    // 💰 Estimated Revenue
    const totalRevenue = enrollments.reduce((sum, enr) => {
      const price = Number(enr.course?.price) || 0;
      return sum + price;
    }, 0);

    // 📊 Progress docs across instructor courses
    const progressDocs = await Progress.find({ course: { $in: courseIds } });

    // Average student completion percentage
    const avgCompletionRate =
      progressDocs.length > 0
        ? Math.round(
            progressDocs.reduce((acc, p) => acc + (p.completionPercentage || 0), 0) /
              progressDocs.length
          )
        : 0;

    // 🤖 AI Mentor Doubts stats
    const doubts = await AiDoubt.find({ course: { $in: courseIds } })
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 });

    const totalDoubts = doubts.length;
    const resolvedDoubts = doubts.filter(
      (d) => d.aiAnswer && d.aiAnswer.trim().length > 5
    ).length;
    const autonomyRate =
      totalDoubts > 0 ? Math.round((resolvedDoubts / totalDoubts) * 100) : 100;

    const recentDoubts = doubts.slice(0, 5).map((d) => ({
      _id: d._id,
      question: d.question,
      aiAnswer: d.aiAnswer,
      studentName: d.student?.name || "Student",
      courseTitle: d.course?.title || "General",
      createdAt: d.createdAt,
    }));

    // 🕒 Recent student enrollments (Activity Feed)
    const sortedEnrollments = [...enrollments].sort(
      (a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt)
    );

    const recentEnrollments = sortedEnrollments.slice(0, 6).map((enr) => {
      const studentIdStr = enr.student?._id?.toString();
      const courseIdStr = enr.course?._id?.toString();
      const progDoc = progressDocs.find(
        (p) =>
          p.student?.toString() === studentIdStr &&
          p.course?.toString() === courseIdStr
      );

      return {
        _id: enr._id,
        studentId: enr.student?._id,
        name: enr.student?.name || "Student",
        email: enr.student?.email || "",
        courseTitle: enr.course?.title || "Course",
        price: enr.course?.price || 0,
        progress: progDoc ? progDoc.completionPercentage : 0,
        enrolledAt: enr.enrolledAt,
      };
    });

    // 📢 Recent Announcements
    const recentAnnouncements = await Announcement.find({ instructor: instructorId })
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .limit(4);

    // 📦 Detailed Course Info for Live Engagement Cards
    const liveCoursesData = courses.map((course) => {
      const courseEnrollments = enrollments.filter(
        (e) => e.course?._id?.toString() === course._id.toString()
      );
      const studentCount = courseEnrollments.length;
      const courseProgressDocs = progressDocs.filter(
        (p) => p.course?.toString() === course._id.toString()
      );
      const avgProgress =
        courseProgressDocs.length > 0
          ? Math.round(
              courseProgressDocs.reduce(
                (sum, p) => sum + (p.completionPercentage || 0),
                0
              ) / courseProgressDocs.length
            )
          : 0;

      return {
        _id: course._id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category || "General",
        level: course.level || "Beginner",
        price: course.price || 0,
        isPublished: course.isPublished,
        createdAt: course.createdAt,
        studentCount,
        revenue: studentCount * (course.price || 0),
        avgProgress,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalCourses,
        publishedCourses,
        draftCourses,
        totalStudents,
        totalEnrollments,
        totalRevenue,
        avgCompletionRate,
        aiStats: {
          totalDoubts,
          resolvedDoubts,
          autonomyRate,
        },
        recentDoubts,
        recentEnrollments,
        recentAnnouncements,
        liveCoursesData,
      },
    });
  } catch (error) {
    console.error("Instructor Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------- TOGGLE COURSE PUBLISH -------------------- */
export const toggleCoursePublish = async (req, res) => {
  try {
    const { courseId } = req.params;
    const instructorId = req.user._id;

    const course = await Course.findOne({ _id: courseId, instructor: instructorId });
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    course.isPublished = !course.isPublished;
    if (course.isPublished && !course.publishedAt) {
      course.publishedAt = new Date();
    }
    await course.save();

    res.status(200).json({
      success: true,
      message: `Course ${course.isPublished ? "published" : "moved to drafts"} successfully`,
      data: {
        _id: course._id,
        isPublished: course.isPublished,
      },
    });
  } catch (error) {
    console.error("Toggle Course Publish Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------- ANNOUNCEMENTS -------------------- */
export const createAnnouncement = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const { title, message, courseId, priority } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const announcement = await Announcement.create({
      instructor: instructorId,
      course: courseId || null,
      title: title.trim(),
      message: message.trim(),
      priority: priority || "normal",
    });

    const populated = await Announcement.findById(announcement._id).populate(
      "course",
      "title"
    );

    res.status(201).json({
      success: true,
      message: "Announcement broadcasted successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Create Announcement Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getAnnouncements = async (req, res) => {
  try {
    const instructorId = req.user._id;
    const announcements = await Announcement.find({ instructor: instructorId })
      .populate("course", "title")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: announcements,
    });
  } catch (error) {
    console.error("Get Announcements Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const instructorId = req.user._id;

    const deleted = await Announcement.findOneAndDelete({
      _id: id,
      instructor: instructorId,
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Announcement not found" });
    }

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Delete Announcement Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/* -------------------- AI ANALYTICS ENGINE -------------------- */
export const getAiAnalytics = async (req, res) => {
  try {
    const instructorId = req.user._id;

    // 1. Find all courses owned by instructor
    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);

    // 2. Fetch all doubts associated with these courses
    const doubts = await AiDoubt.find({ course: { $in: courseIds } })
      .populate("student", "name email")
      .populate("course", "title")
      .sort({ createdAt: -1 });

    // 3. Calculate Autonomy Rate
    const resolvedDoubts = doubts.filter(
      (d) => d.aiAnswer && d.aiAnswer.length > 5
    ).length;
    const autonomyRate =
      doubts.length > 0 ? Math.round((resolvedDoubts / doubts.length) * 100) : 100;

    // 4. Tokenize and count frequently asked topics
    const wordCounts = {};
    const stopWords = [
      "the", "is", "in", "at", "of", "on", "and", "a", "to", "it",
      "how", "why", "what", "can", "do", "i", "my", "not", "for", "with",
      "this", "that", "are", "you", "please", "help"
    ];

    doubts.forEach((d) => {
      const words = d.question
        .toLowerCase()
        .replace(/[^\w\s]/gi, "")
        .split(/\s+/);

      words.forEach((w) => {
        if (w.length > 3 && !stopWords.includes(w)) {
          const formattedTopic = w.charAt(0).toUpperCase() + w.slice(1);
          wordCounts[formattedTopic] = (wordCounts[formattedTopic] || 0) + 1;
        }
      });
    });

    // 5. Sort into top 5 trends
    const topDoubts = Object.keys(wordCounts)
      .map((topic) => ({
        topic,
        count: wordCounts[topic],
        trend: wordCounts[topic] > 2 ? "up" : "down",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. Recent doubts
    const recentDoubts = doubts.slice(0, 20);

    res.status(200).json({
      success: true,
      data: {
        autonomyRate,
        topDoubts,
        totalDoubtsAnalyzed: doubts.length,
        recentDoubts,
      },
    });
  } catch (error) {
    console.error("AI Analytics Error:", error);
    res.status(500).json({ message: "Server error during AI Analysis" });
  }
};

/* -------------------- GET LEARNERS -------------------- */
export const getLearners = async (req, res) => {
  try {
    const instructorId = req.user._id;

    const courses = await Course.find({ instructor: instructorId });
    const courseIds = courses.map((c) => c._id);

    const enrollments = await Enrollment.find({ course: { $in: courseIds } })
      .populate("student", "name email")
      .populate("course", "title");

    const learners = await Promise.all(
      enrollments.map(async (enr) => {
        const progressDoc = await Progress.findOne({
          student: enr.student._id,
          course: enr.course._id,
        });

        return {
          _id: enr._id,
          studentId: enr.student._id,
          name: enr.student.name || "Unknown Student",
          email: enr.student.email,
          course: enr.course.title,
          progress: progressDoc ? progressDoc.completionPercentage : 0,
          enrolledAt: enr.enrolledAt,
        };
      })
    );

    learners.sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt));

    res.status(200).json({
      success: true,
      data: learners,
    });
  } catch (error) {
    console.error("Get Learners Error:", error);
    res.status(500).json({ message: "Server error fetching learners" });
  }
};

/* -------------------- REVOKE LEARNER ACCESS -------------------- */
export const revokeLearnerAccess = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const instructorId = req.user._id;

    const enrollment = await Enrollment.findById(enrollmentId).populate("course");

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment not found" });
    }

    if (enrollment.course.instructor.toString() !== instructorId.toString()) {
      return res.status(403).json({ message: "Not authorized to manage this enrollment" });
    }

    await enrollment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Learner access revoked successfully",
    });
  } catch (error) {
    console.error("Revoke Access Error:", error);
    res.status(500).json({ message: "Server error while revoking access" });
  }
};
