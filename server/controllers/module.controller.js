import Module from "../models/Module.js";
import Course from "../models/Course.js";
import Lesson from "../models/Lesson.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

/* -------------------- CREATE MODULE -------------------- */
export const createModule = async (req, res, next) => {
  try {
    const { title, description, courseId, order } = req.body;

    if (!title || !courseId) {
      throw new ApiError(400, "Title and courseId are required");
    }

    const course = await Course.findById(courseId);
    if (!course) {
      throw new ApiError(404, "Course not found");
    }

    if (course.instructor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not allowed to add modules to this course");
    }

    // Auto-calculate sequential order if not provided
    let calculatedOrder =
      order !== undefined && order !== null && order !== ""
        ? Number(order)
        : undefined;
    if (calculatedOrder === undefined) {
      const count = await Module.countDocuments({ course: courseId });
      calculatedOrder = count + 1;
    }

    const module = await Module.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      course: courseId,
      order: calculatedOrder,
      isPublished: true, // Auto publish module
    });

    res
      .status(201)
      .json(new ApiResponse(201, "Module created successfully", module));
  } catch (error) {
    next(error);
  }
};

/* -------------------- UPDATE MODULE -------------------- */
export const updateModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { title, description, order } = req.body;

    const module = await Module.findById(moduleId).populate("course");
    if (!module) {
      throw new ApiError(404, "Module not found");
    }

    if (
      module.course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ApiError(403, "Not allowed to update this module");
    }

    if (title) module.title = title.trim();
    if (description !== undefined) module.description = description.trim();
    if (order !== undefined) module.order = Number(order);

    await module.save();

    res
      .status(200)
      .json(new ApiResponse(200, "Module updated successfully", module));
  } catch (error) {
    next(error);
  }
};

/* -------------------- DELETE MODULE -------------------- */
export const deleteModule = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const module = await Module.findById(moduleId).populate("course");

    if (!module) {
      throw new ApiError(404, "Module not found");
    }

    if (
      module.course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      throw new ApiError(403, "Not allowed to delete this module");
    }

    // Also delete all lessons inside this module
    await Lesson.deleteMany({ module: moduleId });
    await module.deleteOne();

    res
      .status(200)
      .json(new ApiResponse(200, "Module and its lessons deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/* -------------------- PUBLISH MODULE -------------------- */
export const publishModule = async (req, res, next) => {
  try {
    const module = await Module.findById(req.params.moduleId).populate("course");

    if (!module) {
      throw new ApiError(404, "Module not found");
    }

    // Only course owner can publish
    if (module.course.instructor.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Not allowed to publish this module");
    }

    module.isPublished = true;
    module.publishedAt = new Date();
    await module.save();

    res
      .status(200)
      .json(new ApiResponse(200, "Module published successfully", module));
  } catch (error) {
    next(error);
  }
};

/* -------------------- GET MODULES BY COURSE -------------------- */
export const getModulesByCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;

    const filter = { course: courseId };

    // 🎓 Students see only published modules
    if (req.user.role === "student") {
      filter.isPublished = true;
    }

    // Sort by order ascending, then createdAt ascending
    const modules = await Module.find(filter).sort({ order: 1, createdAt: 1 });

    res
      .status(200)
      .json(new ApiResponse(200, "Modules fetched successfully", modules));
  } catch (error) {
    next(error);
  }
};
