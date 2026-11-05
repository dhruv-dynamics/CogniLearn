import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
      required: false,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false,
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    contentType: {
      type: String,
      enum: ["video", "text", "pdf"],
      default: "video",
    },

    // 🎥 Video lesson (Cloudinary file or direct URL)
    videoUrl: {
      type: String,
      trim: true,
    },

    // 📄 PDF notes
    notesUrl: {
      type: String,
      trim: true,
    },

    thumbnail: {
      type: String,
      trim: true,
    },

    // 📘 Text lesson or companion notes summary
    textContent: {
      type: String,
      trim: true,
    },

    // 🤖 AI generated summary
    aiSummary: {
      type: String,
    },

    duration: {
      type: Number, // in minutes
    },

    order: {
      type: Number,
      default: 0,
    },

    isPreviewFree: {
      type: Boolean,
      default: false,
    },

    releaseAt: {
      type: Date,
      default: null,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    publishedAt: {
      type: Date,
      default: Date.now,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ⚡ PERFORMANCE INDEXES: Speeds up sequential loading in Learning Player
lessonSchema.index({ module: 1, order: 1 });
lessonSchema.index({ course: 1, order: 1 });
lessonSchema.index({ instructor: 1 });

lessonSchema.pre("validate", function () {
  if (!this.contentType) {
    this.contentType = "video";
  }

  if (this.contentType === "text" && !this.textContent) {
    this.textContent = "Content coming soon...";
  }
});

// 🔗 VIRTUAL: Auto-resolve course if lesson belongs to module
lessonSchema.virtual("linkedCourse", {
  ref: "Course",
  localField: "module",
  foreignField: "modules",
  justOne: false,
});

lessonSchema.set("toObject", { virtuals: true });
lessonSchema.set("toJSON", { virtuals: true });

const Lesson = mongoose.model("Lesson", lessonSchema);

export default Lesson;
