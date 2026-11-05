import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import "../../styles/Instructor/ManageCourse.css";

const ManageCourse = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // 1. Course Details Edit Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    title: "",
    category: "Web Development",
    language: "English",
    level: "Beginner",
    price: 0,
    description: "",
    thumbnailFile: null,
    thumbnailPreview: "",
  });
  const [updatingCourse, setUpdatingCourse] = useState(false);

  // 2. Module creation & edit modal states
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });
  const [creatingModule, setCreatingModule] = useState(false);

  const [editingModule, setEditingModule] = useState(null); // module object to edit
  const [editModuleForm, setEditModuleForm] = useState({ title: "", description: "" });
  const [updatingModule, setUpdatingModule] = useState(false);

  // 3. New Lesson Form state
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [lessonType, setLessonType] = useState("video"); // "video" | "pdf" | "text"
  const [lessonForm, setLessonForm] = useState({
    title: "",
    videoUrl: "",
    notesUrl: "",
    textContent: "",
    isPreviewFree: false,
    videoFile: null,
    notesFile: null,
    thumbFile: null,
  });

  // 4. Edit Existing Lesson Modal state
  const [editingLesson, setEditingLesson] = useState(null);
  const [editLessonForm, setEditLessonForm] = useState({
    title: "",
    moduleId: "",
    contentType: "video",
    videoUrl: "",
    notesUrl: "",
    textContent: "",
    isPreviewFree: false,
    videoFile: null,
    notesFile: null,
    thumbFile: null,
  });
  const [updatingLesson, setUpdatingLesson] = useState(false);

  useEffect(() => {
    fetchCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/courses/${courseId}`);
      if (res.data.success) {
        const c = res.data.data;
        setCourse(c);

        // Pre-fill course edit form
        setCourseForm({
          title: c.title || "",
          category: c.category || "Web Development",
          language: c.language || "English",
          level: c.level || "Beginner",
          price: c.price || 0,
          description: c.description || "",
          thumbnailFile: null,
          thumbnailPreview: c.thumbnail || "",
        });

        if (c.modules && c.modules.length > 0 && !selectedModuleId) {
          setSelectedModuleId(c.modules[0]._id);
        }
      }
    } catch (err) {
      console.error("Fetch course error:", err);
      alert("Failed to fetch course details");
    } finally {
      setLoading(false);
    }
  };

  const getMediaUrl = (url) => {
    if (!url) return "";
    const apiUrl = import.meta.env.VITE_API_URL || "";
    return url.startsWith("http") ? url : `${apiUrl}${url}`;
  };

  /* ---------------- TOGGLE PUBLISH ---------------- */
  const handleTogglePublish = async () => {
    try {
      const res = await API.patch(`/instructor/courses/${courseId}/toggle-publish`);
      if (res.data.success) {
        setCourse((prev) => ({ ...prev, isPublished: res.data.data.isPublished }));
      }
    } catch (err) {
      alert("Failed to change publish status");
    }
  };

  /* ---------------- UPDATE COURSE BASIC DETAILS ---------------- */
  const handleUpdateCourseDetails = async (e) => {
    e.preventDefault();
    if (!courseForm.title.trim()) return alert("Course title is required");

    try {
      setUpdatingCourse(true);
      const formData = new FormData();
      formData.append("title", courseForm.title.trim());
      formData.append("description", courseForm.description.trim());
      formData.append("category", courseForm.category);
      formData.append("language", courseForm.language);
      formData.append("level", courseForm.level);
      formData.append("price", courseForm.price || 0);

      if (courseForm.thumbnailFile) {
        formData.append("thumbnail", courseForm.thumbnailFile);
      }

      const res = await API.put(`/courses/${courseId}`, formData);

      if (res.data.success) {
        alert("Course details updated successfully! ✅");
        setShowCourseModal(false);
        fetchCourse();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update course details");
    } finally {
      setUpdatingCourse(false);
    }
  };

  /* ---------------- MODULE CRUD ---------------- */
  const handleCreateModule = async (e) => {
    e.preventDefault();
    if (!moduleForm.title.trim()) return alert("Module title is required");

    try {
      setCreatingModule(true);
      const currentMaxModOrder = (course?.modules || []).reduce(
        (max, m) => Math.max(max, m.order || 0),
        0
      );
      const res = await API.post("/modules", {
        title: moduleForm.title.trim(),
        description: moduleForm.description.trim(),
        courseId,
        order: currentMaxModOrder + 1,
      });

      if (res.data.success) {
        alert("Module created successfully! 📦");
        setModuleForm({ title: "", description: "" });
        setShowModuleModal(false);
        fetchCourse();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to create module");
    } finally {
      setCreatingModule(false);
    }
  };

  const handleOpenEditModule = (mod) => {
    setEditingModule(mod);
    setEditModuleForm({
      title: mod.title || "",
      description: mod.description || "",
      order: mod.order || 1,
    });
  };

  const handleUpdateModule = async (e) => {
    e.preventDefault();
    if (!editModuleForm.title.trim()) return alert("Module title is required");

    try {
      setUpdatingModule(true);
      const res = await API.patch(`/modules/${editingModule._id}`, {
        title: editModuleForm.title.trim(),
        description: editModuleForm.description.trim(),
        order: Number(editModuleForm.order || 1),
      });

      if (res.data.success) {
        alert("Module updated successfully! ✏️");
        setEditingModule(null);
        fetchCourse();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update module");
    } finally {
      setUpdatingModule(false);
    }
  };

  const handleDeleteModule = async (moduleId, title) => {
    if (
      !window.confirm(
        `Are you sure you want to delete module "${title}" and all its lessons?`
      )
    )
      return;

    try {
      await API.delete(`/modules/${moduleId}`);
      alert("Module deleted");
      fetchCourse();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete module");
    }
  };

  /* ---------------- LESSON CRUD ---------------- */
  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) return alert("Lesson title is required");

    let targetModule = selectedModuleId;
    if (!targetModule && (!course.modules || course.modules.length === 0)) {
      try {
        const autoMod = await API.post("/modules", {
          title: "Module 1: Getting Started",
          description: "Course lessons & curriculum",
          courseId,
          order: 0,
        });
        targetModule = autoMod.data.data._id;
      } catch (err) {
        return alert("Failed to auto-create module for lessons.");
      }
    } else if (!targetModule && course.modules && course.modules.length > 0) {
      targetModule = course.modules[0]._id;
    }

    try {
      setUploading(true);
      const targetMod = course.modules?.find((m) => m._id === targetModule);
      const currentMaxOrder = (targetMod?.lessons || []).reduce(
        (max, l) => Math.max(max, l.order || 0),
        0
      );
      const nextOrder = currentMaxOrder + 1;

      const formData = new FormData();
      formData.append("title", lessonForm.title.trim());
      formData.append("moduleId", targetModule);
      formData.append("courseId", courseId);
      formData.append("contentType", lessonType);
      formData.append("isPreviewFree", lessonForm.isPreviewFree);
      formData.append("order", nextOrder);

      if (lessonForm.textContent) {
        formData.append("textContent", lessonForm.textContent);
      }

      if (lessonForm.videoFile) {
        formData.append("video", lessonForm.videoFile);
      } else if (lessonForm.videoUrl) {
        formData.append("videoUrl", lessonForm.videoUrl.trim());
      }

      if (lessonForm.notesFile) {
        formData.append("notes", lessonForm.notesFile);
      } else if (lessonForm.notesUrl) {
        formData.append("notesUrl", lessonForm.notesUrl.trim());
      }

      if (lessonForm.thumbFile) {
        formData.append("thumbnail", lessonForm.thumbFile);
      }

      const res = await API.post("/lessons", formData);

      if (res.data.success) {
        alert("New lesson added successfully! 🚀");
        setLessonForm({
          title: "",
          videoUrl: "",
          notesUrl: "",
          textContent: "",
          isPreviewFree: false,
          videoFile: null,
          notesFile: null,
          thumbFile: null,
        });
        fetchCourse();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to add lesson");
    } finally {
      setUploading(false);
    }
  };

  const handleOpenEditLesson = (lesson, moduleId) => {
    setEditingLesson(lesson);
    setEditLessonForm({
      title: lesson.title || "",
      moduleId: moduleId || selectedModuleId || "",
      contentType: lesson.contentType || "video",
      videoUrl: lesson.videoUrl || "",
      notesUrl: lesson.notesUrl || "",
      textContent: lesson.textContent || "",
      isPreviewFree: !!lesson.isPreviewFree,
      order: lesson.order || 1,
      videoFile: null,
      notesFile: null,
      thumbFile: null,
    });
  };

  const handleUpdateLesson = async (e) => {
    e.preventDefault();
    if (!editLessonForm.title.trim()) return alert("Lesson title is required");

    try {
      setUpdatingLesson(true);
      const formData = new FormData();
      formData.append("title", editLessonForm.title.trim());
      formData.append("contentType", editLessonForm.contentType);
      formData.append("isPreviewFree", editLessonForm.isPreviewFree);
      if (editLessonForm.order !== undefined) {
        formData.append("order", editLessonForm.order);
      }

      if (editLessonForm.textContent !== undefined) {
        formData.append("textContent", editLessonForm.textContent);
      }

      if (editLessonForm.videoFile) {
        formData.append("video", editLessonForm.videoFile);
      } else if (editLessonForm.videoUrl !== undefined) {
        formData.append("videoUrl", editLessonForm.videoUrl.trim());
      }

      if (editLessonForm.notesFile) {
        formData.append("notes", editLessonForm.notesFile);
      } else if (editLessonForm.notesUrl !== undefined) {
        formData.append("notesUrl", editLessonForm.notesUrl.trim());
      }

      const res = await API.patch(`/lessons/${editingLesson._id}`, formData);

      if (res.data.success) {
        alert("Lesson updated successfully! 🚀");
        setEditingLesson(null);
        fetchCourse();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to update lesson");
    } finally {
      setUpdatingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId, title) => {
    if (!window.confirm(`Delete lesson "${title}"?`)) return;
    try {
      await API.delete(`/lessons/${lessonId}`);
      alert("Lesson deleted");
      fetchCourse();
    } catch (err) {
      alert("Failed to delete lesson");
    }
  };

  if (loading) {
    return (
      <div className="manage-loading-screen">
        <span className="spinner"></span> Loading Course Management Engine...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="manage-loading-screen">
        <h3>Course Not Found</h3>
        <button onClick={() => navigate("/instructor/dashboard")}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  const allLessons = course.modules?.flatMap((m) => m.lessons || []) || [];

  return (
    <div className="manage-course-page">
      <div className="manage-course-container">
        {/* HEADER / HERO BANNER */}
        <header className="manage-header-card glass-panel">
          <div className="m-header-left">
            <div className="m-breadcrumbs">
              <span onClick={() => navigate("/instructor/dashboard")}>
                Dashboard
              </span>{" "}
              &gt;{" "}
              <span onClick={() => navigate("/instructor/MyContent")}>
                My Content
              </span>{" "}
              &gt; <b>Curriculum Editor</b>
            </div>
            <h1 className="m-course-title">{course.title}</h1>
            <div className="m-meta-tags">
              <span className={`status-pill ${course.isPublished ? "published" : "draft"}`}>
                {course.isPublished ? "● Published Live" : "○ Draft"}
              </span>
              <span className="tag-pill">🏷️ {course.category}</span>
              <span className="tag-pill">🎯 {course.level}</span>
              <span className="tag-pill price">
                {course.price === 0 ? "Free" : `₹${course.price}`}
              </span>
              <span className="tag-pill">
                📚 {course.modules?.length || 0} Modules • 🎬 {allLessons.length} Stepwise Lessons
              </span>
            </div>
          </div>

          <div className="m-header-actions">
            {/* ⚙️ EDIT COURSE INFO BUTTON */}
            <button
              className="btn-edit-course"
              onClick={() => setShowCourseModal(true)}
              title="Edit course title, price, description, category, and cover image"
            >
              ⚙️ Edit Course Info
            </button>

            <button
              className={`btn-toggle-pub ${course.isPublished ? "unpub" : "pub"}`}
              onClick={handleTogglePublish}
            >
              {course.isPublished ? "Move to Draft" : "🚀 Publish Live"}
            </button>

            {allLessons.length > 0 && (
              <button
                className="btn-preview-player"
                onClick={() =>
                  navigate(`/learn/course/${course._id}/lesson/${allLessons[0]._id}`)
                }
                title="Open Student Learning Player to test playback & notes"
              >
                👁️ Test in Learning Player
              </button>
            )}
          </div>
        </header>

        {/* 2-COLUMN WORKSPACE: LEFT CURRICULUM TREE, RIGHT LESSON BUILDER */}
        <div className="manage-workspace-grid">
          {/* LEFT: STEPWISE MODULES & LESSONS TREE */}
          <section className="curriculum-panel glass-panel">
            <div className="panel-head-bar">
              <div>
                <h3>Stepwise Curriculum Tree 📑</h3>
                <p>Organize chapters, videos, and study notes in sequence.</p>
              </div>
              <button
                className="btn-add-module"
                onClick={() => setShowModuleModal(true)}
              >
                + New Module
              </button>
            </div>

            <div className="modules-stack">
              {course.modules && course.modules.length > 0 ? (
                [...course.modules]
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((mod, modIdx) => (
                    <div key={mod._id} className="module-tree-card">
                      <div className="module-tree-head">
                        <div className="mod-title-info">
                          <span className="mod-number">Module {modIdx + 1}</span>
                          <h4>{mod.title}</h4>
                        </div>
                        <div className="mod-actions" style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="btn-mod-edit"
                            onClick={() => handleOpenEditModule(mod)}
                            title="Rename/Edit Module"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn-mod-del"
                            onClick={() => handleDeleteModule(mod._id, mod.title)}
                            title="Delete module and its lessons"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      {/* Lessons list inside module */}
                      <div className="lessons-step-list">
                        {mod.lessons && mod.lessons.length > 0 ? (
                          [...mod.lessons]
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .map((lesson, lIdx) => (
                              <div key={lesson._id} className="lesson-tree-item">
                                <div className="l-item-left">
                                  <span className="step-idx">{modIdx + 1}.{lIdx + 1}</span>
                                  <span className="step-title">{lesson.title}</span>
                                  <div className="l-badges">
                                    {lesson.contentType === "video" && (
                                      <span className="badge-type video">🎬 Video</span>
                                    )}
                                    {lesson.contentType === "pdf" && (
                                      <span className="badge-type pdf">📄 PDF</span>
                                    )}
                                    {lesson.contentType === "text" && (
                                      <span className="badge-type text">📝 Text</span>
                                    )}
                                    {lesson.notesUrl && (
                                      <span className="badge-type notes">📎 Notes Attached</span>
                                    )}
                                    {lesson.isPreviewFree && (
                                      <span className="badge-type free">Free Preview</span>
                                    )}
                                  </div>
                                </div>

                                <div className="l-item-actions" style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                  {/* ✏️ EDIT LESSON BUTTON */}
                                  <button
                                    className="btn-edit-step"
                                    onClick={() => handleOpenEditLesson(lesson, mod._id)}
                                    title="Edit Lesson Videos / Notes"
                                  >
                                    ✏️ Edit
                                  </button>

                                  <button
                                    className="btn-preview-step"
                                    onClick={() =>
                                      navigate(`/learn/course/${course._id}/lesson/${lesson._id}`)
                                    }
                                    title="Play in Player"
                                  >
                                    ▶ Test
                                  </button>

                                  <button
                                    className="btn-del-step"
                                    onClick={() => handleDeleteLesson(lesson._id, lesson.title)}
                                    title="Delete Lesson"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="empty-module-hint">
                            No lessons inside this module yet. Add one from the right panel! 👉
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="empty-curriculum-box">
                  <div className="empty-icon">📂</div>
                  <h4>No Modules Created Yet</h4>
                  <p>
                    Click <strong>"+ New Module"</strong> above or add a lesson directly to create
                    your first chapter.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* RIGHT: ADD STEPWISE LESSON FORM */}
          <section className="lesson-builder-panel glass-panel">
            <div className="panel-head-bar">
              <div>
                <h3>➕ Add Stepwise Lesson</h3>
                <p>Upload video files or link URLs, accompanied by companion study notes.</p>
              </div>
            </div>

            <form onSubmit={handleAddLesson} className="lesson-builder-form">
              {/* Select Target Module */}
              <div className="form-group">
                <label>Target Module / Chapter *</label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="manage-input"
                >
                  {course.modules && course.modules.length > 0 ? (
                    [...course.modules]
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((m, i) => (
                        <option key={m._id} value={m._id}>
                          Module {i + 1}: {m.title}
                        </option>
                      ))
                  ) : (
                    <option value="">Auto-create Module 1</option>
                  )}
                </select>
              </div>

              {/* Lesson Title */}
              <div className="form-group">
                <label>Lesson Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 01. Setting Up the Environment & Architecture"
                  value={lessonForm.title}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, title: e.target.value })
                  }
                  className="manage-input"
                />
              </div>

              {/* Content Type Selector */}
              <div className="content-type-tabs">
                <button
                  type="button"
                  className={`tab-btn ${lessonType === "video" ? "active" : ""}`}
                  onClick={() => setLessonType("video")}
                >
                  🎬 Video Lesson
                </button>
                <button
                  type="button"
                  className={`tab-btn ${lessonType === "pdf" ? "active" : ""}`}
                  onClick={() => setLessonType("pdf")}
                >
                  📄 PDF Notes Lesson
                </button>
                <button
                  type="button"
                  className={`tab-btn ${lessonType === "text" ? "active" : ""}`}
                  onClick={() => setLessonType("text")}
                >
                  📝 Text Article
                </button>
              </div>

              {/* VIDEO OPTIONS */}
              {lessonType === "video" && (
                <div className="type-options-box">
                  <div
                    style={{
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                      borderRadius: "8px",
                      padding: "12px 16px",
                      marginBottom: "16px",
                      fontSize: "0.85rem",
                      color: "#cbd5e1",
                      lineHeight: "1.6",
                    }}
                  >
                    <strong style={{ color: "#38bdf8", display: "block", marginBottom: "4px" }}>
                      🎥 Unlimited Video Length (1hr, 2hr, 5hr+):
                    </strong>
                    Paste any <strong>YouTube</strong> (Unlisted/Public), <strong>Google Drive</strong>, <strong>Vimeo</strong>, or <strong>Loom</strong> link for instant zero-wait playback. Direct file uploads also supported up to <strong>2 GB</strong> with high-speed streaming!
                  </div>

                  <div className="form-group">
                    <label>🔗 Video Link (YouTube, Google Drive, Vimeo, Loom, or MP4 URL)</label>
                    <input
                      type="text"
                      placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/.../view"
                      value={lessonForm.videoUrl}
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, videoUrl: e.target.value })
                      }
                      className="manage-input"
                    />
                    <small style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                      Supports: YouTube, Google Drive, Vimeo, Loom, and direct MP4/WebM CDN links.
                    </small>
                  </div>

                  <div className="or-divider">
                    <span>OR UPLOAD VIDEO FILE (UP TO 2GB)</span>
                  </div>

                  <div className="form-group">
                    <label>📁 Direct File Upload (MP4 / WebM with HTTP Range Streaming)</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setLessonForm({ ...lessonForm, videoFile: e.target.files[0] })
                      }
                      className="manage-input file-input"
                    />
                  </div>
                </div>
              )}

              {/* COMPANION STUDY NOTES */}
              <div className="notes-options-box">
                <h4>📖 Companion Study Notes (Optional for Students)</h4>
                <div className="form-group">
                  <label>Upload PDF Notes File</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, notesFile: e.target.files[0] })
                    }
                    className="manage-input file-input"
                  />
                </div>

                <div className="form-group">
                  <label>Or PDF Notes URL (Link to Google Drive / Docs)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={lessonForm.notesUrl}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, notesUrl: e.target.value })
                    }
                    className="manage-input"
                  />
                </div>

                <div className="form-group">
                  <label>Written Lesson Notes / Summary / Key Takeaways</label>
                  <textarea
                    rows={4}
                    placeholder="Enter written notes, formulas, or key points for students to read while taking the lesson..."
                    value={lessonForm.textContent}
                    onChange={(e) =>
                      setLessonForm({ ...lessonForm, textContent: e.target.value })
                    }
                    className="manage-input"
                  ></textarea>
                </div>
              </div>

              {/* Free Preview Toggle */}
              <div className="checkbox-row">
                <input
                  type="checkbox"
                  id="preview-check"
                  checked={lessonForm.isPreviewFree}
                  onChange={(e) =>
                    setLessonForm({
                      ...lessonForm,
                      isPreviewFree: e.target.checked,
                    })
                  }
                />
                <label htmlFor="preview-check">
                  Allow Free Preview (Students can view this lesson without enrolling)
                </label>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="btn-submit-lesson"
              >
                {uploading ? "Saving & Processing Lesson..." : "↓ Add Step to Curriculum"}
              </button>
            </form>
          </section>
        </div>
      </div>

      {/* ---------------- 1. COURSE DETAILS EDIT MODAL ---------------- */}
      <AnimatePresence>
        {showCourseModal && (
          <div className="manage-modal-overlay">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="manage-modal-content glass-panel"
              style={{ maxWidth: "650px", maxHeight: "90vh", overflowY: "auto" }}
            >
              <div className="modal-head">
                <h3>⚙️ Update Course Details</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowCourseModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateCourseDetails} className="modal-body-form">
                <div className="form-group">
                  <label>Course Title *</label>
                  <input
                    type="text"
                    required
                    value={courseForm.title}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, title: e.target.value })
                    }
                    className="manage-input"
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={courseForm.category}
                      onChange={(e) =>
                        setCourseForm({ ...courseForm, category: e.target.value })
                      }
                      className="manage-input"
                    >
                      <option value="Web Development">Web Development</option>
                      <option value="Data Science">Data Science</option>
                      <option value="Artificial Intelligence">Artificial Intelligence</option>
                      <option value="Mobile Development">Mobile Development</option>
                      <option value="Business">Business</option>
                      <option value="Design">Design</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Level</label>
                    <select
                      value={courseForm.level}
                      onChange={(e) =>
                        setCourseForm({ ...courseForm, level: e.target.value })
                      }
                      className="manage-input"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div className="form-group">
                    <label>Language</label>
                    <select
                      value={courseForm.language}
                      onChange={(e) =>
                        setCourseForm({ ...courseForm, language: e.target.value })
                      }
                      className="manage-input"
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi / Hinglish</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price (₹) - 0 for Free</label>
                    <input
                      type="number"
                      min="0"
                      value={courseForm.price}
                      onChange={(e) =>
                        setCourseForm({ ...courseForm, price: e.target.value })
                      }
                      className="manage-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Course Description *</label>
                  <textarea
                    rows={4}
                    required
                    value={courseForm.description}
                    onChange={(e) =>
                      setCourseForm({ ...courseForm, description: e.target.value })
                    }
                    className="manage-input"
                  ></textarea>
                </div>

                <div className="form-group">
                  <label>Course Cover / Thumbnail</label>
                  {courseForm.thumbnailPreview && (
                    <div style={{ marginBottom: "8px" }}>
                      <img
                        src={getMediaUrl(courseForm.thumbnailPreview)}
                        alt="Current Thumbnail"
                        style={{ width: "120px", height: "70px", objectFit: "cover", borderRadius: "6px" }}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setCourseForm({
                          ...courseForm,
                          thumbnailFile: file,
                          thumbnailPreview: URL.createObjectURL(file),
                        });
                      }
                    }}
                    className="manage-input file-input"
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setShowCourseModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingCourse}
                    className="btn-modal-submit"
                  >
                    {updatingCourse ? "Saving Changes..." : "Save Course Details"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- 2. EDIT LESSON MODAL ---------------- */}
      <AnimatePresence>
        {editingLesson && (
          <div className="manage-modal-overlay">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="manage-modal-content glass-panel"
              style={{ maxWidth: "620px", maxHeight: "90vh", overflowY: "auto" }}
            >
              <div className="modal-head">
                <h3>✏️ Edit Lesson & Notes</h3>
                <button
                  className="modal-close"
                  onClick={() => setEditingLesson(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateLesson} className="modal-body-form">
                <div className="form-group">
                  <label>Lesson Title *</label>
                  <input
                    type="text"
                    required
                    value={editLessonForm.title}
                    onChange={(e) =>
                      setEditLessonForm({ ...editLessonForm, title: e.target.value })
                    }
                    className="manage-input"
                  />
                </div>

                <div className="form-group" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label>Content Type</label>
                    <select
                      value={editLessonForm.contentType}
                      onChange={(e) =>
                        setEditLessonForm({ ...editLessonForm, contentType: e.target.value })
                      }
                      className="manage-input"
                    >
                      <option value="video">🎬 Video Lesson</option>
                      <option value="pdf">📄 PDF Notes Lesson</option>
                      <option value="text">📝 Text Article</option>
                    </select>
                  </div>
                  <div>
                    <label>Step Sequence Order #</label>
                    <input
                      type="number"
                      min="1"
                      value={editLessonForm.order}
                      onChange={(e) =>
                        setEditLessonForm({ ...editLessonForm, order: Number(e.target.value) })
                      }
                      className="manage-input"
                    />
                  </div>
                </div>

                {/* Video Settings */}
                {editLessonForm.contentType === "video" && (
                  <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <div className="form-group">
                      <label>🔗 Video Link (YouTube, Google Drive, Vimeo, Loom, or MP4 URL)</label>
                      <input
                        type="text"
                        placeholder="https://www.youtube.com/watch?v=... or Google Drive preview link"
                        value={editLessonForm.videoUrl}
                        onChange={(e) =>
                          setEditLessonForm({ ...editLessonForm, videoUrl: e.target.value })
                        }
                        className="manage-input"
                      />
                    </div>

                    <div className="or-divider" style={{ margin: "10px 0" }}>
                      <span>OR REPLACE VIDEO FILE (UP TO 2GB)</span>
                    </div>

                    <div className="form-group">
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) =>
                          setEditLessonForm({ ...editLessonForm, videoFile: e.target.files[0] })
                        }
                        className="manage-input file-input"
                      />
                    </div>
                  </div>
                )}

                {/* PDF Notes Settings */}
                <div style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <label style={{ color: "#38bdf8", fontWeight: "600", fontSize: "0.9rem", display: "block", marginBottom: "8px" }}>
                    📖 Companion PDF Notes
                  </label>
                  <div className="form-group">
                    <label>PDF Notes URL (Google Drive / Doc link)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={editLessonForm.notesUrl}
                      onChange={(e) =>
                        setEditLessonForm({ ...editLessonForm, notesUrl: e.target.value })
                      }
                      className="manage-input"
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: "10px" }}>
                    <label>Or Upload New PDF File</label>
                    <input
                      type="file"
                      accept="application/pdf"
                      onChange={(e) =>
                        setEditLessonForm({ ...editLessonForm, notesFile: e.target.files[0] })
                      }
                      className="manage-input file-input"
                    />
                  </div>
                </div>

                {/* Companion Written Notes */}
                <div className="form-group">
                  <label>📝 Companion Written Notes & Summary</label>
                  <textarea
                    rows={3}
                    placeholder="Key concepts, commands, summary points..."
                    value={editLessonForm.textContent}
                    onChange={(e) =>
                      setEditLessonForm({ ...editLessonForm, textContent: e.target.value })
                    }
                    className="manage-input"
                  ></textarea>
                </div>

                <div className="checkbox-row">
                  <input
                    type="checkbox"
                    id="edit-preview-check"
                    checked={editLessonForm.isPreviewFree}
                    onChange={(e) =>
                      setEditLessonForm({
                        ...editLessonForm,
                        isPreviewFree: e.target.checked,
                      })
                    }
                  />
                  <label htmlFor="edit-preview-check">
                    Allow Free Preview for this lesson
                  </label>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setEditingLesson(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingLesson}
                    className="btn-modal-submit"
                  >
                    {updatingLesson ? "Updating Lesson..." : "Save Lesson Changes 🚀"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- 3. ADD MODULE MODAL ---------------- */}
      <AnimatePresence>
        {showModuleModal && (
          <div className="manage-modal-overlay">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="manage-modal-content glass-panel"
            >
              <div className="modal-head">
                <h3>📦 Add New Module / Chapter</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowModuleModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateModule} className="modal-body-form">
                <div className="form-group">
                  <label>Module Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 2: State Management & Redux Toolkit"
                    value={moduleForm.title}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, title: e.target.value })
                    }
                    className="manage-input"
                  />
                </div>

                <div className="form-group">
                  <label>Module Description (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Brief outline of what this module covers..."
                    value={moduleForm.description}
                    onChange={(e) =>
                      setModuleForm({ ...moduleForm, description: e.target.value })
                    }
                    className="manage-input"
                  ></textarea>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setShowModuleModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingModule}
                    className="btn-modal-submit"
                  >
                    {creatingModule ? "Creating..." : "Create Module"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------- 4. EDIT MODULE MODAL ---------------- */}
      <AnimatePresence>
        {editingModule && (
          <div className="manage-modal-overlay">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="manage-modal-content glass-panel"
            >
              <div className="modal-head">
                <h3>✏️ Edit Module Details</h3>
                <button
                  className="modal-close"
                  onClick={() => setEditingModule(null)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateModule} className="modal-body-form">
                <div className="form-group" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                  <div>
                    <label>Module Title *</label>
                    <input
                      type="text"
                      required
                      value={editModuleForm.title}
                      onChange={(e) =>
                        setEditModuleForm({ ...editModuleForm, title: e.target.value })
                      }
                      className="manage-input"
                    />
                  </div>
                  <div>
                    <label>Module Order #</label>
                    <input
                      type="number"
                      min="1"
                      value={editModuleForm.order}
                      onChange={(e) =>
                        setEditModuleForm({ ...editModuleForm, order: Number(e.target.value) })
                      }
                      className="manage-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Module Description</label>
                  <textarea
                    rows={3}
                    value={editModuleForm.description}
                    onChange={(e) =>
                      setEditModuleForm({ ...editModuleForm, description: e.target.value })
                    }
                    className="manage-input"
                  ></textarea>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setEditingModule(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingModule}
                    className="btn-modal-submit"
                  >
                    {updatingModule ? "Updating..." : "Save Module"}
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

export default ManageCourse;
