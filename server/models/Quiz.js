import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true
    },

    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lesson"
      // optional: lesson-specific quiz
    },

    createdBy: {
      type: String,
      enum: ["ai", "instructor"],
      default: "ai"
    },

    questions: [
      {
        question: {
          type: String,
          required: true
        },

        options: {
          type: [String],
          validate: [arr => arr.length >= 2, "At least 2 options required"]
        },

        correctAnswer: {
          type: String,
          required: true
        },

        explanation: {
          type: String
        }
      }
    ],

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy"
    }
  },
  {
    timestamps: true
  }
);

const Quiz = mongoose.model("Quiz", quizSchema);

export default Quiz;
