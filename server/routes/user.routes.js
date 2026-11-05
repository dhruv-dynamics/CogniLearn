import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import User from "../models/User.js";
import Enrollment from "../models/Enrollment.js";
import Course from "../models/Course.js";
import Progress from "../models/Progress.js";
import Certificate from "../models/Certificate.js";
import bcrypt from "bcryptjs";

const router = express.Router();

// Get current user profile
router.get("/me", protect, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Get student's enrolled courses
router.get("/enrolled-courses", protect, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      student: req.user._id,
      isActive: true 
    })
    .populate({
      path: "course",
      select: "title description thumbnail category level instructor",
      populate: {
        path: "instructor",
        select: "name"
      }
    })
    .sort({ enrolledAt: -1 });

    const courses = enrollments.map(e => ({
      ...e.course.toObject(),
      enrolledAt: e.enrolledAt
    }));

    res.json({
      success: true,
      courses,
      totalEnrolled: courses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch enrolled courses",
      error: error.message
    });
  }
});

// Get student's completed courses
router.get("/completed-courses", protect, async (req, res) => {
  try {
    const completedProgress = await Progress.find({
      student: req.user._id,
      completionPercentage: { $gte: 100 }
    })
    .populate({
      path: "course",
      select: "title description thumbnail category level instructor",
      populate: {
        path: "instructor",
        select: "name"
      }
    })
    .sort({ updatedAt: -1 });

    const courses = completedProgress.map(p => ({
      ...p.course.toObject(),
      completedAt: p.updatedAt
    }));

    res.json({
      success: true,
      courses,
      totalCompleted: courses.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch completed courses",
      error: error.message
    });
  }
});

// Get student's certificates
router.get("/certificates", protect, async (req, res) => {
  try {
    const certificates = await Certificate.find({ 
      student: req.user._id 
    })
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      certificates,
      totalCertificates: certificates.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch certificates",
      error: error.message
    });
  }
});

// Update student profile
router.put("/profile", protect, async (req, res) => {
  try {
    const { name } = req.body;
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    ).select("-password");

    res.json({
      success: true,
      user: updatedUser,
      message: "Profile updated successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message
    });
  }
});

// Change password
router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long"
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to change password",
      error: error.message
    });
  }
});

export default router;
