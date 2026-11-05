import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import InstructorLayout from "../layouts/InstructorLayout";
import Welcome from "../pages/public/Welcome";
import Login from "../pages/public/Login";
import Register from "../pages/public/Register";
import ProtectedRoute from "./ProtectedRoute";

/* Instructor Pages */

import MyContent from "../pages/instructor/MyContent";
import CreateCourse from "../pages/instructor/CreateCourse";
import InstructorProfile from "../pages/instructor/Profile";
import InstructorDashboard from "../pages/instructor/Dashboard";
import AIAnalytics from "../pages/instructor/AIAnalytics";
import Learners from "../pages/instructor/Learners";
import ManageCourse from "../pages/instructor/ManageCourse";

/* Student Pages */

import StudentProfile from "../pages/student/Profile";
import Discover from "../pages/student/Discover";
import MyPath from "../pages/student/MyPath";
import TheVault from "../pages/student/TheVault";
import MentorAI from "../pages/student/MentorAI";
import CourseDetails from "../pages/student/CourseDetails";
import Certificates from "../pages/student/Certificates";

/* Learning Player */

import LearningPlayer from "../pages/student/LearningPlayer";

const AppRoutes = () => {

  return (

    <BrowserRouter>

      <Routes>

        {/* PUBLIC ROUTES */}

        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* STUDENT ROUTES */}

        <Route path="/student/dashboard" element={<Navigate to="/discover" replace />} />

        <Route
          path="/discover"
          element={
            <ProtectedRoute role="student">
              <StudentLayout>
                <Discover />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/my-path"
          element={
            <ProtectedRoute role="student">
              <StudentLayout>
                <MyPath />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/the-vault"
          element={
            <ProtectedRoute role="student">
              <StudentLayout>
                <TheVault />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/mentor-ai"
          element={
            <ProtectedRoute role="student">
              <StudentLayout>
                <MentorAI />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute role="student">
              <StudentLayout>
                <StudentProfile />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/certificates"
          element={
            <ProtectedRoute role="student">
              <StudentLayout>
                <Certificates />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        {/* COURSE OVERVIEW / DETAILS */}
        <Route
          path="/course/:courseId"
          element={
            <ProtectedRoute role="student">
              <StudentLayout>
                <CourseDetails />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        {/* 🎬 LEARNING PLAYER (UPDATED ROUTE) */}

        <Route
          path="/learn/course/:courseId/lesson/:lessonId"
          element={
            <ProtectedRoute role="student">
              <StudentLayout>
                <LearningPlayer />
              </StudentLayout>
            </ProtectedRoute>
          }
        />

        {/* INSTRUCTOR ROUTES */}

        <Route
          path="/instructor/dashboard"
          element={
            <ProtectedRoute role="instructor">
              <InstructorLayout>
                <InstructorDashboard />
              </InstructorLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/MyContent"
          element={
            <ProtectedRoute role="instructor">
              <InstructorLayout>
                <MyContent />
              </InstructorLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/analytics"
          element={
            <ProtectedRoute role="instructor">
              <InstructorLayout>
                <AIAnalytics />
              </InstructorLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/students"
          element={
            <ProtectedRoute role="instructor">
              <InstructorLayout>
                <Learners />
              </InstructorLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/create"
          element={
            <ProtectedRoute role="instructor">
              <InstructorLayout>
                <CreateCourse />
              </InstructorLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/course/:courseId/manage"
          element={
            <ProtectedRoute role="instructor">
              <InstructorLayout>
                <ManageCourse />
              </InstructorLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/instructor/profile"
          element={
            <ProtectedRoute role="instructor">
              <InstructorLayout>
                <InstructorProfile />
              </InstructorLayout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}

        <Route
          path="*"
          element={
            <h1 style={{ color: "white", textAlign: "center", marginTop: "50px" }}>
              404 | Page Not Found
            </h1>
          }
        />

      </Routes>

    </BrowserRouter>

  );

};

export default AppRoutes;