import mongoose from "mongoose";

const vaultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Note", "File"],
      required: true,
    },
    content: {
      type: String,
      default: "", // Used for Notes
    },
    fileUrl: {
      type: String,
      default: null, // Used for Files
    },
  },
  { timestamps: true }
);

export default mongoose.model("VaultItem", vaultSchema);
