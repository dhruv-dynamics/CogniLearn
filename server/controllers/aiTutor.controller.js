// ============================================================
//  aiTutor.controller.js  —  High-Performance Multimodal Mentor AI
//  Smart E-Learning Platform
// ============================================================

import dns from "node:dns";
dns.setDefaultResultOrder("ipv4first");

import fs from "fs";
import AiDoubt from "../models/AiDoubt.js";
import Lesson from "../models/Lesson.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Safe Gemini client initializer
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  if (!apiKey) {
    console.error("❌ [Mentor AI] GEMINI_API_KEY missing in .env file!");
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }

  return new GoogleGenerativeAI(apiKey);
};

// ============================================================
//  POST /api/ai-tutor/ask  (Supports text + optional image)
// ============================================================
export const askAiTutor = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please login again.",
      });
    }

    const { courseId, lessonId } = req.body;
    let question = req.body.question ? req.body.question.trim() : "";

    // Image handling (via multer file upload)
    let imageUrl = null;
    let imagePart = null;

    if (req.file) {
      imageUrl = `/uploads/images/${req.file.filename}`;
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        imagePart = {
          inlineData: {
            data: fileBuffer.toString("base64"),
            mimeType: req.file.mimetype,
          },
        };
      } catch (fileErr) {
        console.warn("⚠️ [Mentor AI] Image buffer conversion failed:", fileErr.message);
      }
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    // Default question if user only sent an image
    if (!question) {
      if (imagePart) {
        question = "Maine ek screenshot/image attach ki hai. Please ise analyze karke explain karo!";
      } else {
        return res.status(400).json({
          success: false,
          message: "Sawal toh poocho yrr! Question empty hai. 😅",
        });
      }
    }

    console.log(`📩 [Mentor AI] Question from student [${studentId}]: "${question}" (Has Image: ${!!imagePart})`);

    // Lesson context fetch if available
    let lessonText = "";
    let contextTitle = "General Study Assistant Mode";

    if (courseId && lessonId) {
      try {
        const lesson = await Lesson.findById(lessonId);
        if (lesson) {
          lessonText = lesson.textContent || lesson.aiSummary || "";
          contextTitle = `Course: ${courseId}, Lesson: ${lesson.title}`;
          console.log(`📚 [Mentor AI] Lesson context loaded: "${lesson.title}"`);
        }
      } catch (err) {
        console.warn("⚠️ [Mentor AI] Lesson fetch failed (ignored):", err.message);
      }
    }

    // Friendly, warm Hinglish Mentor AI persona prompt
    const promptText = `
      Tum ek friendly, smart aur warm mentor ho jiska naam 'Mentor AI' hai. Student se bilkul ek caring dost aur guide ki tarah baat karo.
      Context: ${contextTitle}
      Lesson Content: "${lessonText}"
      Student Question: "${question}"
      ${imagePart ? "Note: Student ne ek image/screenshot attach ki hai. Us image ko dhyan se dekh kar code errors, diagram ya question ka jawab do." : ""}
      
      Instructions:
      1. Tone soft, supportive, cheerful aur bilkul natural hona chahiye. Robotic ya boring mat lagna.
      2. Sirf friendly Hinglish me jawab do. Unnecessary text aur repetition mat karo.
      3. Reply clear, concise aur point-to-point hone chahiye.
      4. Agar image me code error ya bug hai, toh problem batao aur corrected code snippet provide karo.
      5. Padhai ya coding ka doubt ho toh pehle direct simple answer do, fir choti si asaan explanation do.
      6. Agar student sirf "hi/hello" bole, toh ek pyara sa friendly reply do.
      7. Emojis ka use karo par limited aur proper jagah par.
      Aise behave karo jaise tum ek real, caring mentor ho jo student ki help karke khush hoti hai.
    `;

    let aiAnswer = "";
    try {
      const genAI = getGeminiClient();
      const model = genAI.getGenerativeModel({ model: "gemini-flash-lite-latest" });

      const contents = imagePart ? [promptText, imagePart] : promptText;
      const result = await model.generateContent(contents);

      aiAnswer =
        result?.response?.text?.() ||
        result?.response?.candidates?.[0]?.content?.parts?.[0]?.text ||
        null;

      if (!aiAnswer) {
        throw new Error("Gemini returned an empty response.");
      }
    } catch (geminiError) {
      console.error("🚩 [Mentor AI] Gemini API Error:", geminiError?.message);

      aiAnswer =
        "Arre yaar, abhi thoda network issue aa raha hai! 😅 Ek baar dobara try karo ya message bhejo, main yahin hoon! 💪";
    }

    // Save to MongoDB
    let savedDoubt = null;
    try {
      savedDoubt = await AiDoubt.create({
        student: studentId,
        question: question.trim(),
        imageUrl: imageUrl || null,
        aiAnswer,
        course: courseId || undefined,
        lesson: lessonId || undefined,
      });
      console.log("💾 [Mentor AI] Saved doubt to DB id:", savedDoubt._id);
    } catch (dbErr) {
      console.warn("⚠️ [Mentor AI] DB save skipped:", dbErr.message);
      savedDoubt = {
        _id: `temp-${Date.now()}`,
        student: studentId,
        question: question.trim(),
        imageUrl: imageUrl || null,
        aiAnswer,
        createdAt: new Date(),
      };
    }

    return res.status(200).json({
      success: true,
      message: "AI response generated",
      doubt: savedDoubt,
    });
  } catch (error) {
    console.error("🔴 [Mentor AI] Unexpected Server Error:", error?.message);
    return res.status(500).json({
      success: false,
      message: "Mentor AI abhi unavailable hai. Please try again!",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ============================================================
//  GET /api/ai-tutor/history
// ============================================================
export const getAiHistory = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;

    if (!studentId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const { courseId, lessonId } = req.query;
    const filter = { student: studentId };

    // If course/lesson query passed, we can filter or return all
    if (courseId) filter.course = courseId;
    if (lessonId) filter.lesson = lessonId;

    // Fetch up to 100 recent doubts
    const history = await AiDoubt.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .select("question aiAnswer imageUrl createdAt course lesson")
      .lean();

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("🔴 [Mentor AI History] Fetch Error:", error?.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI chat history.",
    });
  }
};

// ============================================================
//  DELETE /api/ai-tutor/history/:doubtId  (Delete single doubt)
// ============================================================
export const deleteAiDoubt = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;
    const { doubtId } = req.params;

    if (!studentId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    const deleted = await AiDoubt.findOneAndDelete({ _id: doubtId, student: studentId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Doubt not found or not authorized." });
    }

    return res.status(200).json({
      success: true,
      message: "Chat item deleted successfully.",
      doubtId,
    });
  } catch (error) {
    console.error("🔴 [Mentor AI] Delete Error:", error?.message);
    return res.status(500).json({ success: false, message: "Failed to delete chat item." });
  }
};

// ============================================================
//  DELETE /api/ai-tutor/history  (Clear all history for student)
// ============================================================
export const clearAiHistory = async (req, res) => {
  try {
    const studentId = req.user?.id || req.user?._id;

    if (!studentId) {
      return res.status(401).json({ success: false, message: "Authentication required." });
    }

    await AiDoubt.deleteMany({ student: studentId });

    return res.status(200).json({
      success: true,
      message: "All chat history cleared successfully.",
    });
  } catch (error) {
    console.error("🔴 [Mentor AI] Clear Error:", error?.message);
    return res.status(500).json({ success: false, message: "Failed to clear chat history." });
  }
};
