import { useEffect, useState, useRef } from "react";
import API from "../../api/axios";

const LessonViewer = ({ lesson, courseId, onComplete, goToNextLesson }) => {
  const [lessonContent, setLessonContent] = useState(null);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (lesson?._id) {
      fetchLessonContent();
      setVideoError(false);
    }
  }, [lesson?._id]);

  const fetchLessonContent = async () => {
    try {
      const res = await API.get(`/lessons/${lesson._id}/content`);
      setLessonContent(res.data?.data || res.data);
    } catch (err) {
      console.error("Failed to load lesson content", err);
    }
  };

  const getMediaUrl = (url) => {
    if (!url) return "";
    const apiUrl = import.meta.env.VITE_API_URL || "";
    return url.startsWith("http") ? url : `${apiUrl}${url}`;
  };

  /* ---------------- UNIVERSAL VIDEO RESOLVER ---------------- */
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

    // 5. Direct Stream (Cloudinary, /uploads/videos/..., MP4)
    return {
      type: "video",
      platform: "Direct",
      streamUrl: getMediaUrl(cleanUrl),
    };
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleVideoEnd = async () => {
    try {
      await API.post("/progress/lesson/complete", {
        courseId,
        lessonId: lesson._id,
      });

      if (onComplete) onComplete();
      if (goToNextLesson) goToNextLesson(lesson._id);
    } catch (err) {
      console.error("Auto-complete failed", err);
    }
  };

  if (!lessonContent) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        <p>Loading lesson content...</p>
      </div>
    );
  }

  const parsedVideo = parseVideoSource(lessonContent.videoUrl);

  return (
    <div className="lesson-viewer" style={{ width: "100%", maxWidth: "1000px", margin: "0 auto" }}>
      {/* 🖼 Thumbnail (Optional) */}
      {lessonContent.thumbnail && (
        <img
          src={getMediaUrl(lessonContent.thumbnail)}
          alt="Lesson thumbnail"
          className="lesson-thumbnail"
          style={{ width: "100%", maxHeight: "280px", objectFit: "cover", borderRadius: "10px", marginBottom: "16px" }}
        />
      )}

      {/* 🎥 Video Lesson (Universal Playback) */}
      {lessonContent.contentType === "video" && (
        <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", background: "#000", borderRadius: "12px", overflow: "hidden", marginBottom: "20px" }}>
          {parsedVideo.type === "iframe" ? (
            <iframe
              src={parsedVideo.embedUrl}
              title={lessonContent.title || "Lesson Video"}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          ) : parsedVideo.type === "video" ? (
            videoError ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
                <h3>⚠️ Video stream issue</h3>
                <a
                  href={parsedVideo.streamUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#38bdf8", marginTop: "10px", display: "inline-block" }}
                >
                  Open Stream in New Tab
                </a>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  key={parsedVideo.streamUrl}
                  src={parsedVideo.streamUrl}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  onEnded={handleVideoEnd}
                  onError={() => setVideoError(true)}
                  style={{ width: "100%", height: "100%", display: "block" }}
                >
                  Your browser does not support the video tag.
                </video>

                {/* Speed Controls for Long Lectures */}
                <div
                  style={{
                    position: "absolute",
                    top: "12px",
                    right: "12px",
                    background: "rgba(15, 23, 42, 0.85)",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    zIndex: 5,
                  }}
                >
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Speed:</span>
                  {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => changeSpeed(rate)}
                      style={{
                        background: playbackRate === rate ? "#38bdf8" : "transparent",
                        color: playbackRate === rate ? "#0f172a" : "#cbd5e1",
                        border: "none",
                        borderRadius: "3px",
                        padding: "1px 5px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        cursor: "pointer",
                      }}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </>
            )
          ) : (
            <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
              <p>No video attached to this lesson.</p>
            </div>
          )}
        </div>
      )}

      {/* 📄 Notes Download Button */}
      {lessonContent.notesUrl && (
        <div style={{ marginBottom: "20px" }}>
          <a
            href={getMediaUrl(lessonContent.notesUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="notes-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 18px",
              background: "rgba(56, 189, 248, 0.15)",
              border: "1px solid rgba(56, 189, 248, 0.35)",
              color: "#38bdf8",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "600",
            }}
          >
            📄 Download Lesson Notes / PDF
          </a>
        </div>
      )}

      {/* 📝 Text Content / Companion Notes */}
      {lessonContent.textContent && (
        <div
          className="text-lesson"
          style={{
            background: "rgba(15, 23, 42, 0.6)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "20px 24px",
            borderRadius: "10px",
            color: "#e2e8f0",
            lineHeight: "1.8",
            whiteSpace: "pre-wrap",
          }}
        >
          {lessonContent.textContent}
        </div>
      )}
    </div>
  );
};

export default LessonViewer;
