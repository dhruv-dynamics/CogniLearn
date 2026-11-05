import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "../../styles/Student/LearningPlayer.css";

const LearningPlayer = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [courseData, setCourseData] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [courseContent, setCourseContent] = useState([]); // Flat sorted lessons
  const [loading, setLoading] = useState(true);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [marking, setMarking] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [copiedNotes, setCopiedNotes] = useState(false);

  // Tab State: "notes" | "pdf" | "ai" | "overview"
  const [activeTab, setActiveTab] = useState("notes");

  // Track expanded modules in sidebar
  const [expandedModules, setExpandedModules] = useState({});

  const getMediaUrl = (url) => {
    if (!url) return "";
    const apiUrl = import.meta.env.VITE_API_URL || "";
    return url.startsWith("http") ? url : `${apiUrl}${url}`;
  };

  /* ---------------- UNIVERSAL VIDEO SOURCE RESOLVER ---------------- */
  const parseVideoSource = (url) => {
    if (!url) return { type: "none" };
    const cleanUrl = url.trim();

    // 1. YouTube
    const ytMatch = cleanUrl.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/i
    );
    if (ytMatch) {
      return {
        type: "iframe",
        platform: "YouTube",
        embedUrl: `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1`,
      };
    }

    // 2. Google Drive
    const driveMatch = cleanUrl.match(
      /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/i
    );
    if (driveMatch) {
      return {
        type: "iframe",
        platform: "Google Drive",
        embedUrl: `https://drive.google.com/file/d/${driveMatch[1]}/preview`,
      };
    }

    // 3. Vimeo
    const vimeoMatch = cleanUrl.match(/(?:vimeo\.com\/)(\d+)/i);
    if (vimeoMatch) {
      return {
        type: "iframe",
        platform: "Vimeo",
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`,
      };
    }

    // 4. Loom
    const loomMatch = cleanUrl.match(/(?:loom\.com\/share\/)([a-zA-Z0-9]+)/i);
    if (loomMatch) {
      return {
        type: "iframe",
        platform: "Loom",
        embedUrl: `https://www.loom.com/embed/${loomMatch[1]}?autoplay=1`,
      };
    }

    // 5. Dailymotion
    const dailyMatch = cleanUrl.match(/(?:dailymotion\.com\/video\/)([a-zA-Z0-9]+)/i);
    if (dailyMatch) {
      return {
        type: "iframe",
        platform: "Dailymotion",
        embedUrl: `https://www.dailymotion.com/embed/video/${dailyMatch[1]}`,
      };
    }

    // 6. Direct Video Stream
    return {
      type: "video",
      platform: "Direct",
      streamUrl: getMediaUrl(cleanUrl),
    };
  };

  /* ---------------- PDF VIEWER URL RESOLVER ---------------- */
  const getPdfEmbedUrl = (url) => {
    if (!url) return "";
    const cleanUrl = url.trim();

    // Google Drive PDF
    const driveMatch = cleanUrl.match(
      /(?:drive\.google\.com\/(?:file\/d\/|open\?id=))([a-zA-Z0-9_-]+)/i
    );
    if (driveMatch) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    return getMediaUrl(cleanUrl);
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  useEffect(() => {
    loadCourse();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  useEffect(() => {
    if (lessonId && lessonId !== "start") {
      loadLesson(lessonId);
    }
  }, [lessonId]);

  useEffect(() => {
    setVideoError(false);
  }, [lessonId]);

  /* ---------------- LOAD COURSE STRUCTURE ---------------- */
  const loadCourse = async () => {
    try {
      setLoading(true);
      const courseRes = await API.get(`/courses/${courseId}`);
      const c = courseRes.data?.data || courseRes.data;
      setCourseData(c);

      // Sort modules by order
      const sortedModules = [...(c.modules || [])].sort(
        (a, b) => (a.order || 0) - (b.order || 0)
      );

      // Initialize all modules as expanded
      const initialExpanded = {};
      sortedModules.forEach((m) => {
        initialExpanded[m._id] = true;
      });
      setExpandedModules(initialExpanded);

      // Flatten sorted lessons sequentially
      const flatLessons = sortedModules.flatMap((m, mIdx) =>
        (m.lessons || [])
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((l, lIdx) => ({
            ...l,
            moduleTitle: m.title,
            moduleId: m._id,
            stepIndexStr: `${mIdx + 1}.${lIdx + 1}`,
          }))
      );
      setCourseContent(flatLessons);

      // Progress
      const progressRes = await API.get(`/progress/course/${courseId}`);
      if (progressRes.data && progressRes.data.completedLessons) {
        setCompletedLessons(
          progressRes.data.completedLessons.map((comp) => comp.lesson?._id || comp.lesson)
        );
      }

      // Auto-navigate to first lesson if on /start
      if ((!lessonId || lessonId === "start") && flatLessons.length > 0) {
        navigate(`/learn/course/${courseId}/lesson/${flatLessons[0]._id}`, {
          replace: true,
        });
      }
    } catch (err) {
      console.error("COURSE LOAD ERROR 👉", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- LOAD LESSON CONTENT ---------------- */
  const loadLesson = async (id) => {
    try {
      const res = await API.get(`/lessons/${id}/content`);
      const lessonData = res.data?.data || res.data;
      setCurrentLesson(lessonData);

      // Auto-switch to notes tab if written notes or PDF notes exist
      if (lessonData.textContent) {
        setActiveTab("notes");
      } else if (lessonData.notesUrl) {
        setActiveTab("pdf");
      } else {
        setActiveTab("notes");
      }
    } catch (err) {
      console.error("LESSON LOAD ERROR 👉", err);
    }
  };

  /* ---------------- STEP NAVIGATION ---------------- */
  const currentIndex = courseContent.findIndex(
    (l) => l._id === (currentLesson?._id || lessonId)
  );
  const currentStepItem = currentIndex >= 0 ? courseContent[currentIndex] : null;
  const prevLesson = currentIndex > 0 ? courseContent[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < courseContent.length - 1
      ? courseContent[currentIndex + 1]
      : null;

  /* ---------------- MARK LESSON COMPLETE ---------------- */
  const handleMarkComplete = async (andNext = false) => {
    const targetId = currentLesson?._id || lessonId;
    if (!targetId) return;

    try {
      setMarking(true);
      await API.post("/progress/lesson/complete", {
        courseId,
        lessonId: targetId,
      });

      if (!completedLessons.includes(targetId)) {
        setCompletedLessons((prev) => [...prev, targetId]);
      }

      if (andNext && nextLesson) {
        navigate(`/learn/course/${courseId}/lesson/${nextLesson._id}`);
      }
    } catch (err) {
      console.error("Failed to mark complete:", err);
    } finally {
      setMarking(false);
    }
  };

  const handleCopyNotes = () => {
    if (currentLesson?.textContent) {
      navigator.clipboard.writeText(currentLesson.textContent);
      setCopiedNotes(true);
      setTimeout(() => setCopiedNotes(false), 2000);
    }
  };

  const toggleModuleAccordion = (modId) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  /* ---------------- RENDER MAIN VIDEO / MEDIA STAGE ---------------- */
  const renderMediaStage = () => {
    if (!currentLesson) {
      return (
        <div className="fallback-lesson-view">
          <h3>Select a lesson from the curriculum checklist to begin</h3>
        </div>
      );
    }

    // 1. VIDEO LESSON
    if (currentLesson.contentType === "video") {
      if (!currentLesson.videoUrl) {
        return (
          <div className="fallback-lesson-view">
            <h3>🎬 Video Coming Soon</h3>
            <p>The instructor is preparing the video lecture. Study the notes below!</p>
          </div>
        );
      }

      const parsed = parseVideoSource(currentLesson.videoUrl);

      // Embedded Iframe (YouTube, Google Drive, Vimeo, Loom)
      if (parsed.type === "iframe") {
        return (
          <div className="react-player-wrapper">
            <iframe
              src={parsed.embedUrl}
              title={currentLesson.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="player-iframe"
            />
          </div>
        );
      }

      // Direct Video Stream (MP4, WebM, Cloudinary, local /uploads/...)
      return (
        <div className="react-player-wrapper">
          {videoError ? (
            <div className="fallback-lesson-view">
              <h3>⚠️ Unable to load video file</h3>
              <p style={{ marginTop: "8px" }}>
                Direct Stream Link:&nbsp;
                <a
                  href={parsed.streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#38bdf8", textDecoration: "underline" }}
                >
                  Open in New Tab
                </a>
              </p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                key={parsed.streamUrl}
                src={parsed.streamUrl}
                controls
                autoPlay
                controlsList="nodownload"
                onEnded={() => {
                  if (!isCurrentDone) handleMarkComplete(true);
                }}
                className="native-video-elem"
                onError={(e) => {
                  console.error("VIDEO ERROR:", e);
                  setVideoError(true);
                }}
              >
                Your browser does not support the video tag.
              </video>

              {/* Playback Speed Controls Overlay */}
              <div className="player-speed-pill">
                <span>Speed:</span>
                {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    className={`btn-speed ${playbackRate === rate ? "active" : ""}`}
                    onClick={() => changeSpeed(rate)}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      );
    }

    // 2. PDF ONLY LESSON
    if (currentLesson.contentType === "pdf") {
      if (!currentLesson.notesUrl) {
        return (
          <div className="fallback-lesson-view">
            <h3>📄 Document / PDF Coming Soon</h3>
          </div>
        );
      }
      return (
        <div className="pdf-lesson-stage">
          <iframe
            src={getPdfEmbedUrl(currentLesson.notesUrl)}
            title="PDF Document"
            className="pdf-iframe-full"
            frameBorder="0"
          />
        </div>
      );
    }

    // 3. TEXT ONLY LESSON
    if (currentLesson.contentType === "text") {
      return (
        <div className="text-lesson-stage">
          <h2>{currentLesson.title}</h2>
          <div className="text-lesson-content">
            {currentLesson.textContent || "No text content provided."}
          </div>
        </div>
      );
    }

    return (
      <div className="fallback-lesson-view">
        <h3>Content is processing or unavailable</h3>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="player-loading">
        <span className="spinner"></span>
        <p>Loading your interactive session & curriculum...</p>
      </div>
    );
  }

  const isCurrentDone = completedLessons.includes(
    currentLesson?._id || lessonId
  );

  return (
    <div className="pro-player-wrapper">
      {/* ---------------- MAIN LEARNING STAGE ---------------- */}
      <div className="pro-main-panel">
        {/* TOP STATUS BAR */}
        <div className="player-top-nav">
          <div className="top-nav-left">
            <button
              className="btn-back-course"
              onClick={() => navigate(`/course/${courseId}`)}
            >
              ← {courseData?.title ? `${courseData.title.substring(0, 32)}...` : "Course Overview"}
            </button>
          </div>

          <div className="top-nav-center">
            <span className="step-counter">
              Step {currentIndex >= 0 ? currentIndex + 1 : 1} of {courseContent.length}
              {currentStepItem?.stepIndexStr && ` (Section ${currentStepItem.stepIndexStr})`}
            </span>
          </div>

          <div className="top-nav-right">
            <button
              className="btn-ask-ai"
              onClick={() =>
                navigate(
                  `/student/mentor-ai?courseId=${courseId}&lessonId=${lessonId}`
                )
              }
            >
              🤖 Ask Mentor AI
            </button>
          </div>
        </div>

        {/* 🎬 CINEMA VIDEO / MEDIA STAGE */}
        <div className="video-section">{renderMediaStage()}</div>

        {/* LESSON DETAILS & STEPWISE CONTROLS */}
        <div className="lesson-details-panel">
          <div className="ld-header">
            <div className="ld-header-text">
              <div className="ld-badges-row">
                <span className="lesson-step-tag">
                  {currentStepItem?.stepIndexStr
                    ? `Step ${currentStepItem.stepIndexStr}`
                    : `Step ${currentIndex + 1}`}
                </span>
                {currentStepItem?.moduleTitle && (
                  <span className="lesson-module-tag">
                    📁 {currentStepItem.moduleTitle}
                  </span>
                )}
                {currentLesson?.notesUrl && (
                  <span className="tag-has-notes">📄 PDF Notes Ready</span>
                )}
                {currentLesson?.textContent && (
                  <span className="tag-has-text">📝 Study Notes Ready</span>
                )}
              </div>
              <h1 className="lesson-title">{currentLesson?.title}</h1>
            </div>

            {/* STEPWISE ACTION BUTTONS */}
            <div className="ld-actions">
              {prevLesson && (
                <button
                  className="btn-step-prev"
                  onClick={() =>
                    navigate(
                      `/learn/course/${courseId}/lesson/${prevLesson._id}`
                    )
                  }
                >
                  ← Previous
                </button>
              )}

              {isCurrentDone ? (
                <button className="btn-mark completed" disabled>
                  ✓ Completed
                </button>
              ) : (
                <button
                  className="btn-mark"
                  onClick={() => handleMarkComplete(false)}
                  disabled={marking}
                >
                  {marking ? "Saving..." : "✓ Mark Done"}
                </button>
              )}

              {nextLesson && (
                <button
                  className="btn-step-next"
                  onClick={() =>
                    isCurrentDone
                      ? navigate(
                          `/learn/course/${courseId}/lesson/${nextLesson._id}`
                        )
                      : handleMarkComplete(true)
                  }
                >
                  Next Step →
                </button>
              )}
            </div>
          </div>

          {/* 🌟 HIGH-VISIBILITY TABBED NOTES & CONTENT SYSTEM */}
          <div className="learning-tabs-container">
            <div className="learning-tabs-nav">
              <button
                className={`lt-tab-btn ${activeTab === "notes" ? "active" : ""}`}
                onClick={() => setActiveTab("notes")}
              >
                📝 Written Notes
                {currentLesson?.textContent && (
                  <span className="tab-pill-badge">Available</span>
                )}
              </button>

              <button
                className={`lt-tab-btn ${activeTab === "pdf" ? "active" : ""}`}
                onClick={() => setActiveTab("pdf")}
              >
                📄 PDF Handout
                {currentLesson?.notesUrl && (
                  <span className="tab-pill-badge">Available</span>
                )}
              </button>

              <button
                className={`lt-tab-btn ${activeTab === "ai" ? "active" : ""}`}
                onClick={() => setActiveTab("ai")}
              >
                🤖 Mentor AI Doubt
              </button>

              <button
                className={`lt-tab-btn ${activeTab === "overview" ? "active" : ""}`}
                onClick={() => setActiveTab("overview")}
              >
                ℹ️ Lesson Overview
              </button>
            </div>

            <div className="learning-tabs-content">
              {/* TAB 1: WRITTEN NOTES */}
              {activeTab === "notes" && (
                <div className="tab-pane-content">
                  <div className="notes-box-header">
                    <div className="nb-title">
                      <h3>📝 Study Summary & Lecture Notes</h3>
                      <p>Key takeaways, commands, code snippets and instructions written by your instructor.</p>
                    </div>
                    {currentLesson?.textContent && (
                      <button
                        className="btn-copy-notes"
                        onClick={handleCopyNotes}
                      >
                        {copiedNotes ? "✓ Copied!" : "📋 Copy Notes"}
                      </button>
                    )}
                  </div>

                  {currentLesson?.textContent ? (
                    <div className="notes-rich-body">
                      {currentLesson.textContent}
                    </div>
                  ) : (
                    <div className="empty-notes-prompt">
                      <div className="en-icon">📝</div>
                      <h4>No Written Notes For This Step</h4>
                      <p>
                        The teacher has not added written notes for this specific step yet.
                        {currentLesson?.notesUrl
                          ? " But there is a PDF Handout available in the next tab! 👉"
                          : " You can ask Mentor AI for an instant summary! 🤖"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PDF DOCUMENT HANDOUT */}
              {activeTab === "pdf" && (
                <div className="tab-pane-content">
                  <div className="notes-box-header">
                    <div className="nb-title">
                      <h3>📄 Companion PDF Handouts & Docs</h3>
                      <p>Official study material, lecture slides and assignment sheets.</p>
                    </div>
                    {currentLesson?.notesUrl && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <a
                          href={getMediaUrl(currentLesson.notesUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-open-new-tab"
                        >
                          ↗️ Open in New Window
                        </a>
                        <a
                          href={getMediaUrl(currentLesson.notesUrl)}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="btn-download-pdf"
                        >
                          ⬇️ Download PDF
                        </a>
                      </div>
                    )}
                  </div>

                  {currentLesson?.notesUrl ? (
                    <div className="pdf-embed-container">
                      <iframe
                        src={getPdfEmbedUrl(currentLesson.notesUrl)}
                        title="PDF Handout"
                        className="pdf-inline-iframe"
                        frameBorder="0"
                      />
                    </div>
                  ) : (
                    <div className="empty-notes-prompt">
                      <div className="en-icon">📄</div>
                      <h4>No PDF Document Attached</h4>
                      <p>
                        The instructor did not upload a separate PDF document for this lesson.
                        Check the <strong>Written Notes</strong> tab above for the lecture summary!
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: MENTOR AI DOUBT SOLVER */}
              {activeTab === "ai" && (
                <div className="tab-pane-content ai-tab-pane">
                  <div className="ai-launcher-card">
                    <div className="ai-avatar">🤖</div>
                    <div className="ai-text">
                      <h3>Have a doubt in this lesson?</h3>
                      <p>
                        Mentor AI knows everything about <strong>"{currentLesson?.title}"</strong> and
                        can explain concepts, debug code, or answer your queries in friendly Hinglish!
                      </p>
                    </div>
                    <button
                      className="btn-launch-ai"
                      onClick={() =>
                        navigate(
                          `/student/mentor-ai?courseId=${courseId}&lessonId=${lessonId}`
                        )
                      }
                    >
                      Open Mentor AI Chat →
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: LESSON OVERVIEW */}
              {activeTab === "overview" && (
                <div className="tab-pane-content">
                  <div className="overview-grid">
                    <div className="ov-card">
                      <span className="ov-lbl">Course</span>
                      <strong>{courseData?.title}</strong>
                    </div>
                    <div className="ov-card">
                      <span className="ov-lbl">Module</span>
                      <strong>{currentStepItem?.moduleTitle || "General"}</strong>
                    </div>
                    <div className="ov-card">
                      <span className="ov-lbl">Format</span>
                      <strong style={{ textTransform: "uppercase" }}>
                        {currentLesson?.contentType || "Video"}
                      </strong>
                    </div>
                    <div className="ov-card">
                      <span className="ov-lbl">Access</span>
                      <strong>
                        {currentLesson?.isPreviewFree ? "Free Preview" : "Enrolled"}
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- SIDEBAR: GROUPED BY MODULE & SORTED ---------------- */}
      <aside className="pro-sidebar-panel">
        <div className="ps-header">
          <div className="ps-title-row">
            <h3>Course Curriculum</h3>
            <span className="ps-pct-pill">
              {courseContent.length > 0
                ? Math.round((completedLessons.length / courseContent.length) * 100)
                : 0}
              %
            </span>
          </div>
          <p>
            {completedLessons.length} of {courseContent.length} Steps Completed
          </p>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{
                width: `${
                  courseContent.length > 0
                    ? (completedLessons.length / courseContent.length) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* MODULE ACCORDION LIST */}
        <div className="ps-module-accordion-list">
          {courseData?.modules && courseData.modules.length > 0 ? (
            [...courseData.modules]
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((mod, modIdx) => {
                const isExpanded = expandedModules[mod._id] !== false;
                const sortedLessons = [...(mod.lessons || [])].sort(
                  (a, b) => (a.order || 0) - (b.order || 0)
                );
                const modCompletedCount = sortedLessons.filter((l) =>
                  completedLessons.includes(l._id)
                ).length;

                return (
                  <div key={mod._id} className="ps-module-group">
                    {/* Module Accordion Header */}
                    <div
                      className="ps-module-header"
                      onClick={() => toggleModuleAccordion(mod._id)}
                    >
                      <div className="ps-mh-left">
                        <span className="ps-mh-arrow">{isExpanded ? "▼" : "▶"}</span>
                        <div>
                          <h4 className="ps-mh-title">
                            Module {modIdx + 1}: {mod.title}
                          </h4>
                          <span className="ps-mh-sub">
                            {modCompletedCount}/{sortedLessons.length} Completed
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Lessons inside Module */}
                    {isExpanded && (
                      <div className="ps-module-lessons">
                        {sortedLessons.map((lesson, lIdx) => {
                          const isActive =
                            lesson._id === (currentLesson?._id || lessonId);
                          const isDone = completedLessons.includes(lesson._id);

                          return (
                            <div
                              key={lesson._id}
                              className={`ps-lesson-item ${isActive ? "active" : ""} ${
                                isDone ? "done" : ""
                              }`}
                              onClick={() =>
                                navigate(
                                  `/learn/course/${courseId}/lesson/${lesson._id}`
                                )
                              }
                            >
                              <div className="ps-step-num">
                                {isDone ? "✓" : `${modIdx + 1}.${lIdx + 1}`}
                              </div>

                              <div className="ps-meta">
                                <h4>{lesson.title}</h4>
                                <div className="ps-badges-line">
                                  <span className="ps-badge">
                                    {lesson.contentType === "video"
                                      ? "🎬 Video"
                                      : lesson.contentType === "pdf"
                                      ? "📄 PDF"
                                      : "📝 Text"}
                                  </span>
                                  {lesson.notesUrl && (
                                    <span className="ps-badge notes">📎 PDF</span>
                                  )}
                                  {lesson.textContent && (
                                    <span className="ps-badge text">📝 Notes</span>
                                  )}
                                </div>
                              </div>

                              {isActive && <div className="ps-active-glow">▶</div>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
          ) : (
            <div style={{ padding: "20px", textAlign: "center", color: "#94a3b8" }}>
              <p>No modules available</p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default LearningPlayer;
