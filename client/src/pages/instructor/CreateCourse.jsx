import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "../../styles/Instructor/CreateCourse.css";

const CreateCourse = () => {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // STEP 1: Course Info
  const [courseInfo, setCourseInfo] = useState({
    title: "",
    category: "Web Development",
    language: "English",
    level: "Beginner",
    price: "",
    description: "",
    thumbnail: null,
    thumbnailPreview: null,
  });

  // STEP 2: Curriculum Lessons List
  const [lessons, setLessons] = useState([]);

  // Active lesson input fields for the "add lesson" sub-form
  const [currentLesson, setCurrentLesson] = useState({
    title: "",
    videoSource: "url", // "url" | "file"
    videoUrl: "",
    videoFile: null,
    notesSource: "text", // "text" | "file" | "url"
    notesUrl: "",
    notesFile: null,
    textContent: "",
    thumbnail: null,
    videoName: "",
    notesName: "",
    thumbnailName: "",
  });

  /* ---------------- EVENT HANDLERS ---------------- */
  const handleCourseInfoChange = (e) => {
    setCourseInfo({ ...courseInfo, [e.target.name]: e.target.value });
  };

  const handleCourseThumbnail = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCourseInfo({
        ...courseInfo,
        thumbnail: file,
        thumbnailPreview: URL.createObjectURL(file),
      });
    }
  };

  const handleAddLesson = () => {
    if (!currentLesson.title.trim()) {
      alert("Lesson title is required!");
      return;
    }

    setLessons([...lessons, { ...currentLesson, id: Date.now() }]);

    // Reset current lesson form
    setCurrentLesson({
      title: "",
      videoSource: "url",
      videoUrl: "",
      videoFile: null,
      notesSource: "text",
      notesUrl: "",
      notesFile: null,
      textContent: "",
      thumbnail: null,
      videoName: "",
      notesName: "",
      thumbnailName: "",
    });
  };

  const removeLesson = (id) => {
    setLessons(lessons.filter((l) => l.id !== id));
  };

  /* ---------------- API SUBMIT ---------------- */
  const submitCourse = async () => {
    try {
      setLoading(true);

      /* ---------- 1. CREATE COURSE ---------- */
      const courseData = new FormData();
      courseData.append("title", courseInfo.title);
      courseData.append("description", courseInfo.description);
      courseData.append("category", courseInfo.category);
      courseData.append("language", courseInfo.language);
      courseData.append("level", courseInfo.level);
      courseData.append("price", courseInfo.price || 0);

      if (courseInfo.thumbnail) {
        courseData.append("thumbnail", courseInfo.thumbnail);
      }

      const courseRes = await API.post("/courses", courseData);

      if (!courseRes.data.success) {
        alert(courseRes.data.message || "Failed to create course");
        setLoading(false);
        return;
      }

      const courseId = courseRes.data.data._id;

      /* ---------- 2. CREATE DEFAULT MODULE ---------- */
      const moduleRes = await API.post("/modules", {
        title: "Course Curriculum",
        courseId,
      });

      if (!moduleRes.data.success) {
        alert(moduleRes.data.message || "Failed to structure curriculum.");
        setLoading(false);
        return;
      }

      const moduleId = moduleRes.data.data._id;

      /* ---------- 3. UPLOAD STEPWISE LESSONS ---------- */
      const uploadPromises = lessons.map((lesson, idx) => {
        const lessonData = new FormData();
        lessonData.append("title", lesson.title);
        lessonData.append("moduleId", moduleId);
        lessonData.append("courseId", courseId);
        lessonData.append("order", idx + 1);

        let contentType = "text";
        if (lesson.videoFile || lesson.videoUrl) contentType = "video";
        else if (lesson.notesFile || lesson.notesUrl) contentType = "pdf";
        else if (lesson.textContent) contentType = "text";

        lessonData.append("contentType", contentType);

        if (lesson.videoFile) lessonData.append("video", lesson.videoFile);
        if (lesson.videoUrl) lessonData.append("videoUrl", lesson.videoUrl);
        if (lesson.notesFile) lessonData.append("notes", lesson.notesFile);
        if (lesson.notesUrl) lessonData.append("notesUrl", lesson.notesUrl);
        if (lesson.textContent) lessonData.append("textContent", lesson.textContent);
        if (lesson.thumbnail) lessonData.append("thumbnail", lesson.thumbnail);

        return API.post("/lessons", lessonData);
      });

      const lessonResults = await Promise.allSettled(uploadPromises);
      const failed = lessonResults.filter(
        (r) => r.status === "rejected" || !r.value?.data?.success
      );
      if (failed.length > 0) {
        console.warn(`Warning: ${failed.length} lessons had upload warnings.`);
      }

      alert("Course created & published successfully! 🚀");
      navigate("/instructor/mycontent");
    } catch (error) {
      console.error("COURSE SUBMIT ERROR:", error);
      alert(
        error.response?.data?.message ||
          "An error occurred while uploading. Please check the console."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- ANIMATION VARIANTS ---------------- */
  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
  };

  return (
    <div className="create-course-wrapper">
      <div className="create-container auto-glass">
        {/* BREADCRUMB & HEADER */}
        <div className="header-actions">
          <p className="breadcrumb">
            <span onClick={() => navigate("/instructor/dashboard")}>
              Dashboard
            </span>{" "}
            &gt; <b>Create Course</b>
          </p>
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Back
          </button>
        </div>

        {/* STEPPER */}
        <div className="modern-stepper">
          <div className={`step-item ${activeStep >= 1 ? "active" : ""}`}>
            <div className="circle">1</div>
            <span>Course Info</span>
          </div>
          <div className={`step-line ${activeStep >= 2 ? "active" : ""}`}></div>
          <div className={`step-item ${activeStep >= 2 ? "active" : ""}`}>
            <div className="circle">2</div>
            <span>Curriculum & Notes</span>
          </div>
          <div className={`step-line ${activeStep >= 3 ? "active" : ""}`}></div>
          <div className={`step-item ${activeStep >= 3 ? "active" : ""}`}>
            <div className="circle">3</div>
            <span>Review & Publish</span>
          </div>
        </div>

        {/* STEPS CONTENT */}
        <AnimatePresence mode="wait">
          {/* ----- STEP 1: COURSE INFO ----- */}
          {activeStep === 1 && (
            <motion.div
              key="step1"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="step-content"
            >
              <h2>Step 1: Basic Information 📝</h2>
              <p className="step-desc">Establish the foundation of your course.</p>

              <div className="form-grid">
                {/* Thumbnail Preview Area */}
                <div className="thumbnail-upload-box">
                  {courseInfo.thumbnailPreview ? (
                    <img
                      src={courseInfo.thumbnailPreview}
                      alt="Preview"
                      className="img-preview"
                    />
                  ) : (
                    <div className="placeholder-img">
                      <span>🖼️</span>
                      <p>Upload Course Cover</p>
                    </div>
                  )}
                  <input
                    type="file"
                    id="course-thumb"
                    accept="image/*"
                    onChange={handleCourseThumbnail}
                    hidden
                  />
                  <label htmlFor="course-thumb" className="upload-lbl">
                    Choose Thumbnail
                  </label>
                </div>

                {/* Info Fields */}
                <div className="info-fields">
                  <div className="input-group full-width">
                    <label>Course Title *</label>
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g. Complete Full Stack Mastery with AI"
                      value={courseInfo.title}
                      onChange={handleCourseInfoChange}
                    />
                  </div>

                  <div className="inline-grid-2">
                    <div className="input-group">
                      <label>
                        Price (₹){" "}
                        <span style={{ fontSize: "0.8rem", opacity: 0.6 }}>
                          (0 for Free)
                        </span>
                      </label>
                      <input
                        type="number"
                        name="price"
                        placeholder="499"
                        value={courseInfo.price}
                        onChange={handleCourseInfoChange}
                      />
                    </div>

                    <div className="input-group">
                      <label>Language</label>
                      <select
                        name="language"
                        value={courseInfo.language}
                        onChange={handleCourseInfoChange}
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi / Hinglish</option>
                        <option value="Spanish">Spanish</option>
                        <option value="French">French</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Category</label>
                      <select
                        name="category"
                        value={courseInfo.category}
                        onChange={handleCourseInfoChange}
                      >
                        <option value="Web Development">Web Development</option>
                        <option value="Data Science">Data Science</option>
                        <option value="Artificial Intelligence">Artificial Intelligence</option>
                        <option value="Business">Business</option>
                        <option value="Design">Design</option>
                      </select>
                    </div>

                    <div className="input-group">
                      <label>Level</label>
                      <select
                        name="level"
                        value={courseInfo.level}
                        onChange={handleCourseInfoChange}
                      >
                        <option value="Beginner">Beginner</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Advanced">Advanced</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="input-group full-width" style={{ marginTop: "20px" }}>
                <label>Detailed Description *</label>
                <textarea
                  rows="4"
                  name="description"
                  placeholder="What will students learn in this course?"
                  value={courseInfo.description}
                  onChange={handleCourseInfoChange}
                ></textarea>
              </div>

              <div className="step-actions right">
                <button
                  className="primary-btn"
                  onClick={() => {
                    if (!courseInfo.title || !courseInfo.description) {
                      return alert("Title and Description are required.");
                    }
                    setActiveStep(2);
                  }}
                >
                  Save & Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* ----- STEP 2: LESSON CONTENT ----- */}
          {activeStep === 2 && (
            <motion.div
              key="step2"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="step-content"
            >
              <h2>Step 2: Stepwise Curriculum & Notes 📚</h2>
              <p className="step-desc">
                Add ordered lessons with playable videos (YouTube or uploaded file) and companion study notes.
              </p>

              {/* Added Lessons List */}
              <div className="lessons-list">
                {lessons.length === 0 ? (
                  <p className="empty-msg">
                    No lessons added yet. Use the quick form below to add your first lesson.
                  </p>
                ) : (
                  lessons.map((l, index) => (
                    <div key={l.id} className="lesson-card">
                      <div className="lc-info">
                        <h4>
                          Step {index + 1}: {l.title}
                        </h4>
                        <div className="lc-badges">
                          {(l.videoFile || l.videoUrl) && (
                            <span className="badge video">
                              🎬 Video {l.videoUrl ? "(URL)" : "(File)"}
                            </span>
                          )}
                          {(l.notesFile || l.notesUrl) && (
                            <span className="badge pdf">
                              📄 PDF Notes
                            </span>
                          )}
                          {l.textContent && (
                            <span className="badge thumb">
                              📝 Text Notes
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="del-btn" onClick={() => removeLesson(l.id)}>
                        ❌
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add New Lesson Form */}
              <div className="add-lesson-box">
                <h3>+ Add Stepwise Lesson</h3>

                <div className="input-group full-width">
                  <label>Lesson Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Step 1: Course Overview & Environment Setup"
                    value={currentLesson.title}
                    onChange={(e) =>
                      setCurrentLesson({ ...currentLesson, title: e.target.value })
                    }
                  />
                </div>

                {/* Video Source Picker */}
                <div style={{ marginTop: "10px" }}>
                  <div
                    style={{
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.25)",
                      borderRadius: "8px",
                      padding: "10px 14px",
                      marginBottom: "12px",
                      fontSize: "0.82rem",
                      color: "#cbd5e1",
                      lineHeight: "1.5",
                    }}
                  >
                    <strong style={{ color: "#38bdf8" }}>🎥 Long Videos Supported (Any Length): </strong>
                    Paste any <strong>YouTube</strong> (Unlisted/Public), <strong>Google Drive</strong>, <strong>Vimeo</strong>, or <strong>Loom</strong> link for zero wait time. Or upload files up to <strong>2 GB</strong>!
                  </div>

                  <label style={{ fontSize: "0.85rem", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
                    Video Source:
                  </label>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <button
                      type="button"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        border: currentLesson.videoSource === "url" ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                        background: currentLesson.videoSource === "url" ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.05)",
                        color: currentLesson.videoSource === "url" ? "#38bdf8" : "#cbd5e1"
                      }}
                      onClick={() => setCurrentLesson({ ...currentLesson, videoSource: "url" })}
                    >
                      🔗 Video Link (YouTube / Google Drive / Vimeo / Loom)
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: "6px 14px",
                        borderRadius: "6px",
                        fontSize: "0.82rem",
                        fontWeight: "600",
                        cursor: "pointer",
                        border: currentLesson.videoSource === "file" ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                        background: currentLesson.videoSource === "file" ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.05)",
                        color: currentLesson.videoSource === "file" ? "#38bdf8" : "#cbd5e1"
                      }}
                      onClick={() => setCurrentLesson({ ...currentLesson, videoSource: "file" })}
                    >
                      📁 Upload File (Up to 2GB)
                    </button>
                  </div>

                  {currentLesson.videoSource === "url" ? (
                    <div className="input-group full-width">
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/.../view"
                        value={currentLesson.videoUrl}
                        onChange={(e) =>
                          setCurrentLesson({ ...currentLesson, videoUrl: e.target.value })
                        }
                      />
                      <small style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
                        Tip: For long 1-3 hour lectures, paste your YouTube (Unlisted) or Google Drive video share link.
                      </small>
                    </div>
                  ) : (
                    <div className="file-uploader" style={{ marginBottom: "12px" }}>
                      <label htmlFor="l-vid" className="up-btn">
                        🎬 {currentLesson.videoName || "Choose Video File (MP4, WebM - Up to 2GB)"}
                      </label>
                      <input
                        type="file"
                        id="l-vid"
                        accept="video/*"
                        hidden
                        onChange={(e) =>
                          setCurrentLesson({
                            ...currentLesson,
                            videoFile: e.target.files[0],
                            videoName: e.target.files[0]?.name,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                {/* Written Companion Notes */}
                <div className="input-group full-width" style={{ marginTop: "10px" }}>
                  <label>📝 Companion Written Notes & Summary (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Key concepts, commands, summary points, or assignment instructions for this lesson..."
                    value={currentLesson.textContent}
                    onChange={(e) =>
                      setCurrentLesson({
                        ...currentLesson,
                        textContent: e.target.value,
                      })
                    }
                  ></textarea>
                </div>

                {/* PDF Notes File / URL */}
                <div style={{ marginTop: "10px" }}>
                  <label style={{ fontSize: "0.85rem", color: "#94a3b8", display: "block", marginBottom: "8px" }}>
                    Companion PDF Notes / Handout (Optional):
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div className="file-uploader">
                      <label htmlFor="l-pdf" className="up-btn">
                        📄 {currentLesson.notesName || "Upload PDF Notes"}
                      </label>
                      <input
                        type="file"
                        id="l-pdf"
                        accept="application/pdf"
                        hidden
                        onChange={(e) =>
                          setCurrentLesson({
                            ...currentLesson,
                            notesFile: e.target.files[0],
                            notesName: e.target.files[0]?.name,
                          })
                        }
                      />
                    </div>
                    <div>
                      <input
                        type="url"
                        placeholder="Or PDF Doc Link (https://...)"
                        value={currentLesson.notesUrl}
                        onChange={(e) =>
                          setCurrentLesson({
                            ...currentLesson,
                            notesUrl: e.target.value,
                          })
                        }
                        style={{ height: "42px" }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="add-list-btn"
                  onClick={handleAddLesson}
                  style={{ marginTop: "16px" }}
                >
                  ↓ Add This Step to Curriculum
                </button>
              </div>

              <div className="step-actions between">
                <button className="secondary-btn" onClick={() => setActiveStep(1)}>
                  ← Previous
                </button>
                <button
                  className="primary-btn"
                  onClick={() => {
                    if (lessons.length === 0) {
                      return alert("Please add at least one lesson before proceeding.");
                    }
                    setActiveStep(3);
                  }}
                >
                  Save & Continue →
                </button>
              </div>
            </motion.div>
          )}

          {/* ----- STEP 3: REVIEW & PUBLISH ----- */}
          {activeStep === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="step-content"
            >
              <div className="review-header">
                <h2>Step 3: Review & Publish 🚀</h2>
                <span className="status-badge draft">Status: READY TO PUBLISH</span>
              </div>
              <p className="step-desc">
                Double-check your course details and curriculum sequence before it goes live.
              </p>

              <div className="review-box">
                <div className="r-header">
                  <h3>Course Overview</h3>
                  <button className="edit-link" onClick={() => setActiveStep(1)}>
                    Edit
                  </button>
                </div>
                <div className="r-content course-r">
                  {courseInfo.thumbnailPreview && (
                    <img
                      src={courseInfo.thumbnailPreview}
                      alt="thumb"
                      className="tiny-thumb"
                    />
                  )}
                  <div className="r-text">
                    <h4>{courseInfo.title}</h4>
                    <p className="r-meta">
                      Price: ₹{courseInfo.price || 0} • Language:{" "}
                      {courseInfo.language} • {courseInfo.category} •{" "}
                      {courseInfo.level}
                    </p>
                    <p className="r-desc">
                      {courseInfo.description.substring(0, 140)}...
                    </p>
                  </div>
                </div>
              </div>

              <div className="review-box">
                <div className="r-header">
                  <h3>Stepwise Curriculum Outline ({lessons.length} Lessons)</h3>
                  <button className="edit-link" onClick={() => setActiveStep(2)}>
                    Edit
                  </button>
                </div>
                <div className="r-content">
                  <ul className="r-list">
                    {lessons.map((l, i) => (
                      <li key={i}>
                        <b>
                          Step {i + 1}: {l.title}
                        </b>
                        <span className="r-details">
                          {l.videoFile || l.videoUrl ? " [🎬 Video]" : ""}
                          {l.textContent ? " [📝 Notes]" : ""}
                          {l.notesFile || l.notesUrl ? " [📄 PDF]" : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="step-actions between">
                <button className="secondary-btn" onClick={() => setActiveStep(2)}>
                  ← Previous
                </button>
                <button
                  className="publish-course-btn"
                  onClick={submitCourse}
                  disabled={loading}
                >
                  {loading
                    ? "Publishing Course & Uploading Lessons..."
                    : "Submit & Publish Course 🚀"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreateCourse;
