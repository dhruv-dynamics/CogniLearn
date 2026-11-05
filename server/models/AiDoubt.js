import mongoose from "mongoose";

const aiDoubtSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: false,
      default: null,
      index: true,
    },
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson",
      required: false,
      default: null,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      default: null,
    },
    aiAnswer: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// Compound index for fast student chat history retrieval
aiDoubtSchema.index({ student: 1, createdAt: -1 });

const AiDoubt = mongoose.model("AiDoubt", aiDoubtSchema);
export default AiDoubt;
