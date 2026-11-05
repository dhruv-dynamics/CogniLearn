import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    category: {
      type: String,
      required: true,
      default: "Web Development",
    },

    language: {
      type: String,
      default: "English",
    },

    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    price: {
      type: Number,
      default: 0,
    },

    thumbnail: {
      type: String, // 🖼 stores /uploads/filename
      default: null,
    },

    isPublished: {
      type: Boolean,
      default: false,
    },

    publishedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ⚡ PERFORMANCE INDEXES: Speeds up dashboard, catalog, and query seeks
courseSchema.index({ instructor: 1, createdAt: -1 });
courseSchema.index({ isPublished: 1, createdAt: -1 });
courseSchema.index({ category: 1, isPublished: 1 });

/* 🔥 Virtual: Course → Modules */
courseSchema.virtual("modules", {
  ref: "Module",
  localField: "_id",
  foreignField: "course",
});

courseSchema.set("toObject", { virtuals: true });
courseSchema.set("toJSON", { virtuals: true });

export default mongoose.model("Course", courseSchema);
