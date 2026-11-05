import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    // 📘 Lessons student has completed
    completedLessons: [
      {
        lesson: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Lesson",
          required: true,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // ▶ Resume learning feature
    lastAccessedLesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
    },

    lastAccessedAt: {
      type: Date,
      default: Date.now,
    },

    // 📊 Course completion %
    completionPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

// 🔒 Ensure one progress record per student per course
progressSchema.index({ student: 1, course: 1 }, { unique: true });

// 🚫 Prevent duplicate lessons in completedLessons
progressSchema.methods.isLessonCompleted = function (lessonId) {
  return this.completedLessons.some(
    (entry) => entry.lesson.toString() === lessonId.toString()
  );
};

// 🧠 Update completion percentage helper
progressSchema.methods.calculateCompletion = function (totalLessons) {
  if (totalLessons === 0) {
    this.completionPercentage = 0;
  } else {
    this.completionPercentage = Math.round(
      (this.completedLessons.length / totalLessons) * 100
    );
  }
};

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
