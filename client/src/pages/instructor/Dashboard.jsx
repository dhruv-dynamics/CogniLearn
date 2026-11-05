import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import "../../styles/Instructor/Dashboard.css";

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    avgCompletionRate: 0,
    aiStats: {
      totalDoubts: 0,
      resolvedDoubts: 0,
      autonomyRate: 100,
    },
    recentDoubts: [],
    recentEnrollments: [],
    recentAnnouncements: [],
    liveCoursesData: [],
  });

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Announcement Modal State
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);
  const [announceForm, setAnnounceForm] = useState({
    title: "",
    message: "",
    courseId: "",
    priority: "normal",
  });
  const [sendingAnnounce, setSendingAnnounce] = useState(false);

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      const res = await API.get("/instructor/dashboard");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Quick Toggle Course Publish Status
  const handleTogglePublish = async (courseId) => {
    try {
      const res = await API.patch(`/instructor/courses/${courseId}/toggle-publish`);
      if (res.data.success) {
        const newStatus = res.data.data.isPublished;
        setStats((prev) => ({
          ...prev,
          publishedCourses: newStatus
            ? prev.publishedCourses + 1
            : Math.max(0, prev.publishedCourses - 1),
          draftCourses: newStatus
            ? Math.max(0, prev.draftCourses - 1)
            : prev.draftCourses + 1,
          liveCoursesData: prev.liveCoursesData.map((c) =>
            c._id === courseId ? { ...c, isPublished: newStatus } : c
          ),
        }));
      }
    } catch (err) {
      console.error("Toggle Publish Failed", err);
      alert("Failed to update course status.");
    }
  };

  // Delete Course
  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (
      window.confirm(
        `Are you sure you want to permanently delete "${courseTitle}"? This will delete all lessons and enrolled student data.`
      )
    ) {
      try {
        const res = await API.delete(`/courses/${courseId}`);
        if (res.data.success) {
          setStats((prev) => ({
            ...prev,
            liveCoursesData: prev.liveCoursesData.filter((c) => c._id !== courseId),
            totalCourses: Math.max(0, prev.totalCourses - 1),
          }));
        }
      } catch (error) {
        console.error("Failed to delete course", error);
        alert(error.response?.data?.message || "Failed to delete the course.");
      }
    }
  };

  // Submit Announcement
  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!announceForm.title.trim() || !announceForm.message.trim()) {
      alert("Please provide both a title and a message.");
      return;
    }

    try {
      setSendingAnnounce(true);
      const res = await API.post("/instructor/announcements", announceForm);
      if (res.data.success) {
        alert("Announcement broadcasted successfully! 📢");
        setStats((prev) => ({
          ...prev,
          recentAnnouncements: [res.data.data, ...(prev.recentAnnouncements || [])],
        }));
        setAnnounceForm({ title: "", message: "", courseId: "", priority: "normal" });
        setShowAnnounceModal(false);
      }
    } catch (err) {
      console.error("Announcement Error", err);
      alert("Failed to send announcement.");
    } finally {
      setSendingAnnounce(false);
    }
  };

  // Delete Announcement
  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm("Remove this announcement?")) return;
    try {
      const res = await API.delete(`/instructor/announcements/${id}`);
      if (res.data.success) {
        setStats((prev) => ({
          ...prev,
          recentAnnouncements: prev.recentAnnouncements.filter((a) => a._id !== id),
        }));
      }
    } catch (err) {
      console.error("Delete Announcement Error", err);
    }
  };

  // Filtered Courses
  const filteredCourses = stats.liveCoursesData?.filter((course) => {
    const matchesSearch = course.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "published"
        ? course.isPublished
        : !course.isPublished;
    const matchesCategory =
      categoryFilter === "all"
        ? true
        : course.category?.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(
    new Set(stats.liveCoursesData?.map((c) => c.category).filter(Boolean))
  );

  return (
    <div className="ins-dashboard-wrapper">
      <main className="ins-main-content">
        {/* 🌟 HERO / HEADER SECTION */}
        <header className="ins-dashboard-header">
          <div className="header-left">
            <div className="ins-badge-row">
              <span className="ins-live-pulse-badge">
                <span className="pulse-dot"></span> Platform Live
              </span>
              <span className="ins-mentor-ai-badge">🤖 Mentor AI Active</span>
            </div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="ins-welcome-title"
            >
              Teacher Control Center 🎛️
            </motion.h1>
            <p className="ins-subtitle">
              Welcome back, <strong>{user?.name || "Professor"}</strong>! Track student
              engagement, curriculum mastery, and AI tutor interactions in real time.
            </p>
          </div>

          <div className="header-actions">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="ins-btn-announce"
              onClick={() => setShowAnnounceModal(true)}
            >
              📢 Post Notice
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="ins-btn-create"
              onClick={() => navigate("/instructor/create")}
            >
              ➕ Create Course
            </motion.button>
          </div>
        </header>

        {/* 📊 5-CARD KPI METRICS GRID */}
        <div className="ins-kpi-grid">
          <StatCard
            title="Active Learners"
            value={stats.totalStudents}
            subtitle={`${stats.totalEnrollments || 0} Total Enrollments`}
            icon="👥"
            color="cyan"
            loading={loading}
          />
          <StatCard
            title="Courses Portfolio"
            value={stats.totalCourses}
            subtitle={`${stats.publishedCourses || 0} Live • ${stats.draftCourses || 0} Draft`}
            icon="📚"
            color="blue"
            loading={loading}
          />
          <StatCard
            title="Estimated Revenue"
            value={`₹${(stats.totalRevenue || 0).toLocaleString()}`}
            subtitle="Gross Platform Volume"
            icon="💰"
            color="emerald"
            loading={loading}
          />
          <StatCard
            title="AI Autonomy Rate"
            value={`${stats.aiStats?.autonomyRate ?? 100}%`}
            subtitle={`${stats.aiStats?.totalDoubts || 0} Doubts Analyzed`}
            icon="🤖"
            color="purple"
            loading={loading}
          />
          <StatCard
            title="Avg Student Progress"
            value={`${stats.avgCompletionRate || 0}%`}
            subtitle="Curriculum Mastery"
            icon="📈"
            color="amber"
            loading={loading}
          />
        </div>

        {/* ⚡ QUICK NAVIGATION COMMAND STRIP */}
        <div className="ins-command-strip glass-card">
          <div className="strip-title">
            <span>⚡ Quick Navigation</span>
          </div>
          <div className="strip-buttons">
            <button
              className="strip-btn"
              onClick={() => navigate("/instructor/MyContent")}
            >
              📑 Curriculum Manager
            </button>
            <button
              className="strip-btn"
              onClick={() => navigate("/instructor/students")}
            >
              👥 Enrolled Learners ({stats.totalStudents})
            </button>
            <button
              className="strip-btn"
              onClick={() => navigate("/instructor/analytics")}
            >
              🧠 AI Insights & Doubts Hub
            </button>
            <button
              className="strip-btn"
              onClick={() => navigate("/instructor/profile")}
            >
              ⚙️ Instructor Profile
            </button>
          </div>
        </div>

        {/* 📚 LIVE COURSES MANAGEMENT HUB */}
        <section className="ins-section glass-card">
          <div className="section-head-bar">
            <div>
              <h3>Course Management & Engagement</h3>
              <p className="section-subtitle">
                Inspect performance metrics, manage syllabus, and toggle publishing.
              </p>
            </div>
            <span className="count-pill">
              {filteredCourses?.length || 0} Course(s) Displayed
            </span>
          </div>

          {/* Controls Bar: Search & Filters */}
          <div className="ins-filters-bar">
            <div className="ins-search-wrapper">
              <span className="search-symbol">🔍</span>
              <input
                type="text"
                placeholder="Search courses by title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ins-search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm("")}
                >
                  ✕
                </button>
              )}
            </div>

            <div className="filter-select-group">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ins-select"
              >
                <option value="all">All Statuses</option>
                <option value="published">Published Only</option>
                <option value="draft">Drafts Only</option>
              </select>

              {categories.length > 0 && (
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="ins-select"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Course Cards Grid */}
          <div className="ins-course-grid">
            {loading ? (
              <div className="ins-empty-state">
                <p>Loading course metrics...</p>
              </div>
            ) : filteredCourses && filteredCourses.length > 0 ? (
              filteredCourses.map((course, idx) => (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={course._id}
                  className="ins-course-card"
                >
                  {/* Thumbnail / Header */}
                  <div className="ins-card-thumb">
                    <img
                      src={
                        course.thumbnail
                          ? course.thumbnail.startsWith("http")
                            ? course.thumbnail
                            : `${import.meta.env.VITE_API_URL}${course.thumbnail}`
                          : "/course-placeholder.jpg"
                      }
                      alt={course.title}
                      onError={(e) => {
                        e.target.src =
                          "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60";
                      }}
                    />
                    <div className="thumb-badges">
                      <span
                        className={`status-pill ${
                          course.isPublished ? "published" : "draft"
                        }`}
                      >
                        {course.isPublished ? "● Live" : "○ Draft"}
                      </span>
                      <span className="category-pill">{course.category}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="ins-card-body">
                    <div className="card-top-row">
                      <h4 className="ins-card-title" title={course.title}>
                        {course.title}
                      </h4>
                      <span className="ins-card-price">
                        {course.price === 0 ? "Free" : `₹${course.price}`}
                      </span>
                    </div>

                    <p className="ins-card-desc">
                      {course.description
                        ? course.description.slice(0, 85) + "..."
                        : "No course description provided."}
                    </p>

                    {/* Progress & Learners */}
                    <div className="ins-card-metrics">
                      <div className="metric-row">
                        <span>👤 Enrolled Learners:</span>
                        <strong>{course.studentCount}</strong>
                      </div>
                      <div className="metric-row">
                        <span>📊 Avg Student Progress:</span>
                        <strong>{course.avgProgress}%</strong>
                      </div>

                      <div className="progress-mini-bar">
                        <div
                          className="progress-mini-fill"
                          style={{ width: `${course.avgProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="ins-card-actions">
                      <button
                        className={`btn-toggle-status ${
                          course.isPublished ? "btn-unpublish" : "btn-publish"
                        }`}
                        onClick={() => handleTogglePublish(course._id)}
                        title={course.isPublished ? "Unpublish to Draft" : "Publish Course"}
                      >
                        {course.isPublished ? "Move to Draft" : "🚀 Publish"}
                      </button>

                      <button
                        className="btn-manage"
                        onClick={() =>
                          navigate(`/instructor/course/${course._id}/manage`)
                        }
                        title="Edit Syllabus, Lessons & Quizzes"
                      >
                        ✏️ Manage
                      </button>

                      <button
                        className="btn-delete"
                        onClick={() =>
                          handleDeleteCourse(course._id, course.title)
                        }
                        title="Delete Course"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="ins-empty-state">
                <div className="empty-icon">📚</div>
                <h4>No courses matched your filters</h4>
                <p>Try adjusting your search query or create a new course.</p>
                <button
                  className="ins-btn-create"
                  style={{ marginTop: "15px" }}
                  onClick={() => navigate("/instructor/create")}
                >
                  ➕ Create First Course
                </button>
              </div>
            )}
          </div>
        </section>

        {/* 👥 & 🤖 TWO-COLUMN ACTIVITY & AI PULSE */}
        <div className="ins-dual-grid">
          {/* Column 1: Recent Enrolled Learners Feed */}
          <section className="ins-section glass-card">
            <div className="section-head-bar">
              <div>
                <h3>Recent Enrolled Learners</h3>
                <p className="section-subtitle">Real-time learning activity across courses.</p>
              </div>
              <button
                className="text-link-btn"
                onClick={() => navigate("/instructor/students")}
              >
                View All Learners →
              </button>
            </div>

            <div className="learners-feed-list">
              {stats.recentEnrollments && stats.recentEnrollments.length > 0 ? (
                stats.recentEnrollments.map((enr) => (
                  <div key={enr._id} className="learner-feed-item">
                    <div className="learner-feed-avatar">
                      {enr.name ? enr.name.charAt(0).toUpperCase() : "S"}
                    </div>
                    <div className="learner-feed-info">
                      <div className="learner-feed-top">
                        <span className="learner-feed-name">{enr.name}</span>
                        <span className="learner-feed-date">
                          {new Date(enr.enrolledAt).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="learner-feed-course">
                        📚 {enr.courseTitle}
                      </span>
                      <div className="learner-feed-prog">
                        <div className="prog-track">
                          <div
                            className="prog-fill"
                            style={{ width: `${enr.progress}%` }}
                          ></div>
                        </div>
                        <span className="prog-text">{enr.progress}%</span>
                      </div>
                    </div>
                    {enr.email && (
                      <a
                        href={`mailto:${enr.email}`}
                        className="learner-email-action"
                        title={`Send email to ${enr.email}`}
                      >
                        ✉️
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="ins-empty-small">
                  <p>No student enrollments recorded yet.</p>
                </div>
              )}
            </div>
          </section>

          {/* Column 2: Mentor AI Doubts Pulse */}
          <section className="ins-section glass-card">
            <div className="section-head-bar">
              <div>
                <h3>Mentor AI Doubts Pulse 🤖</h3>
                <p className="section-subtitle">
                  Questions asked to AI by your students.
                </p>
              </div>
              <button
                className="text-link-btn"
                onClick={() => navigate("/instructor/analytics")}
              >
                Deep AI Analytics →
              </button>
            </div>

            <div className="doubts-pulse-list">
              {stats.recentDoubts && stats.recentDoubts.length > 0 ? (
                stats.recentDoubts.map((doubt) => (
                  <div key={doubt._id} className="doubt-pulse-item">
                    <div className="doubt-pulse-header">
                      <span className="doubt-student-tag">
                        👤 {doubt.studentName}
                      </span>
                      <span className="doubt-course-tag">
                        {doubt.courseTitle}
                      </span>
                    </div>
                    <p className="doubt-question">Q: "{doubt.question}"</p>
                    {doubt.aiAnswer && (
                      <div className="doubt-ai-snippet">
                        <span className="ai-tag">AI Answer:</span>{" "}
                        {doubt.aiAnswer.length > 130
                          ? doubt.aiAnswer.slice(0, 130) + "..."
                          : doubt.aiAnswer}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="ins-empty-small">
                  <p>Students haven't asked any doubts yet. AI is standing by!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* 📢 RECENT BROADCASTS / ANNOUNCEMENTS SECTION */}
        <section className="ins-section glass-card mt-section">
          <div className="section-head-bar">
            <div>
              <h3>Recent Announcements & Notices</h3>
              <p className="section-subtitle">
                Broadcast messages delivered to students in your courses.
              </p>
            </div>
            <button
              className="ins-btn-announce"
              onClick={() => setShowAnnounceModal(true)}
            >
              📢 + New Notice
            </button>
          </div>

          <div className="announcements-grid">
            {stats.recentAnnouncements && stats.recentAnnouncements.length > 0 ? (
              stats.recentAnnouncements.map((ann) => (
                <div key={ann._id} className="announcement-card">
                  <div className="ann-card-head">
                    <span className={`ann-priority-pill ${ann.priority}`}>
                      {ann.priority?.toUpperCase()}
                    </span>
                    <span className="ann-date">
                      {new Date(ann.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="ann-title">{ann.title}</h4>
                  <p className="ann-target">
                    🎯 Target: {ann.course?.title || "All Enrolled Students"}
                  </p>
                  <p className="ann-msg">{ann.message}</p>
                  <button
                    className="ann-del-btn"
                    onClick={() => handleDeleteAnnouncement(ann._id)}
                    title="Delete notice"
                  >
                    🗑️ Remove
                  </button>
                </div>
              ))
            ) : (
              <div className="ins-empty-state">
                <p>No notices posted yet. Click "+ New Notice" to broadcast updates.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* 📢 POST ANNOUNCEMENT MODAL */}
      <AnimatePresence>
        {showAnnounceModal && (
          <div
            className="ins-modal-overlay"
            onClick={() => setShowAnnounceModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="ins-modal-content glass-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h3>📢 Broadcast Student Announcement</h3>
                  <p>Notify learners about upcoming deadlines, live sessions, or updates.</p>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowAnnounceModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSendAnnouncement} className="modal-form">
                <div className="form-group">
                  <label>Announcement Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Live Q&A Session this Friday at 6 PM"
                    value={announceForm.title}
                    onChange={(e) =>
                      setAnnounceForm({ ...announceForm, title: e.target.value })
                    }
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Target Audience</label>
                    <select
                      value={announceForm.courseId}
                      onChange={(e) =>
                        setAnnounceForm({ ...announceForm, courseId: e.target.value })
                      }
                    >
                      <option value="">All My Students (Global)</option>
                      {stats.liveCoursesData?.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Priority Level</label>
                    <select
                      value={announceForm.priority}
                      onChange={(e) =>
                        setAnnounceForm({ ...announceForm, priority: e.target.value })
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="important">Important</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Announcement Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write your announcement details here..."
                    value={announceForm.message}
                    onChange={(e) =>
                      setAnnounceForm({ ...announceForm, message: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="modal-cancel-btn"
                    onClick={() => setShowAnnounceModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="modal-submit-btn"
                    disabled={sendingAnnounce}
                  >
                    {sendingAnnounce ? "Sending..." : "🚀 Send Notice"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Reusable StatCard Component
const StatCard = ({ title, value, subtitle, icon, color, loading }) => (
  <motion.div
    whileHover={{ y: -6, transition: { duration: 0.2 } }}
    className={`ins-stat-card ${color} glass-card`}
  >
    <div className="stat-card-top">
      <span className="stat-title">{title}</span>
      <div className="stat-icon-wrap">{icon}</div>
    </div>
    <div className="stat-value">
      <h3>{loading ? "..." : value}</h3>
    </div>
    {subtitle && <span className="stat-subtitle">{subtitle}</span>}
  </motion.div>
);

export default InstructorDashboard;
