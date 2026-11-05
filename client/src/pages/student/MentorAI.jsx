import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import "../../styles/student/MentorAI.css";

const MentorAI = ({ courseId: propCourseId, lessonId: propLessonId }) => {
  const [searchParams] = useSearchParams();
  const courseId = propCourseId || searchParams.get("courseId") || "";
  const lessonId = propLessonId || searchParams.get("lessonId") || "";

  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "Namaste! Main aapka AI Mentor hoon 🤖 Aap lesson se related ya koi general doubt pooch sakte hain.",
    },
  ]);

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeItem, setActiveItem] = useState("all");
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, lessonId]);

  const fetchHistory = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await fetch("/api/ai-tutor/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHistory(data.data);

        // Load all past chats in chronological order so past chats are visible!
        if (data.data.length > 0) {
          const past = [...data.data].reverse().flatMap((item) => [
            { role: "user", text: item.question },
            { role: "ai", text: item.aiAnswer || "No answer recorded." },
          ]);
          setMessages([
            {
              role: "ai",
              text: "Namaste! Main aapka AI Mentor hoon 🤖 Aap lesson se related ya koi general doubt pooch sakte hain.",
            },
            ...past,
          ]);
        }
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const loadAllChats = () => {
    setActiveItem("all");
    if (history.length > 0) {
      const past = [...history].reverse().flatMap((item) => [
        { role: "user", text: item.question },
        { role: "ai", text: item.aiAnswer || "No answer recorded." },
      ]);
      setMessages([
        {
          role: "ai",
          text: "Namaste! Main aapka AI Mentor hoon 🤖 Aap lesson se related ya koi general doubt pooch sakte hain.",
        },
        ...past,
      ]);
    } else {
      setMessages([
        {
          role: "ai",
          text: "Namaste! Main aapka AI Mentor hoon 🤖 Aap lesson se related ya koi general doubt pooch sakte hain.",
        },
      ]);
    }
  };

  const loadHistoryChat = (item, idx) => {
    setActiveItem(idx);
    setMessages([
      { role: "user", text: item.question },
      { role: "ai", text: item.aiAnswer || "No answer recorded." },
    ]);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userText }]);
    setInput("");
    setIsTyping(true);

    try {
      const token = sessionStorage.getItem("token");

      const requestBody =
        courseId && lessonId
          ? { courseId, lessonId, question: userText }
          : { question: userText };

      const res = await fetch("/api/ai-tutor/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await res.json();

      const aiReply =
        data?.doubt?.aiAnswer ||
        data?.message ||
        "AI tutor abhi response nahi de pa raha.";

      setMessages((prev) => [...prev, { role: "ai", text: aiReply }]);

      if (data?.doubt && data.doubt.question) {
        setHistory((prev) => [
          data.doubt,
          ...prev.filter((h) => h._id !== data.doubt._id),
        ]);
      }
    } catch (error) {
      console.error("AI Tutor Error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Server error. Try again later." },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="mentor-ai-wrapper">
      {/* SIDEBAR */}
      <div className="mentor-sidebar">
        <div>
          <h3>AI Assistant</h3>
          <div
            className={`history-item ${activeItem === "all" ? "active" : ""}`}
            onClick={loadAllChats}
            style={{ cursor: "pointer", fontWeight: "600" }}
          >
            {courseId && lessonId
              ? "Lesson Doubt Mode 📘"
              : "General Doubt Mode 🌍"}
          </div>
          <div className="sidebar-stats">
            <p>
              Status: <span className="online-dot"></span> Active
            </p>
          </div>
        </div>

        <div className="chat-history-list">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
            }}
          >
            <h4 style={{ fontSize: "0.85rem", opacity: 0.8, margin: 0 }}>
              Recent Doubts 📜 ({history.length})
            </h4>
            {history.length > 0 && activeItem !== "all" && (
              <button
                onClick={loadAllChats}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#38bdf8",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                View All
              </button>
            )}
          </div>

          {history.length > 0 ? (
            history.map((item, idx) => (
              <div
                key={item._id || idx}
                className={`history-item ${activeItem === idx ? "active" : ""}`}
                onClick={() => loadHistoryChat(item, idx)}
                style={{
                  fontSize: "0.85rem",
                  padding: "10px 8px",
                  cursor: "pointer",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
                title={item.question}
              >
                💬 {item.question}
              </div>
            ))
          ) : (
            <p style={{ fontSize: "0.8rem", opacity: 0.6, paddingLeft: "5px" }}>
              No previous doubts yet.
            </p>
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="mentor-chat-area">
        <header className="chat-header">
          <h2>
            Mentor <span>AI</span> ✨
          </h2>
          <span className="status-badge">
            {courseId && lessonId
              ? "Smart Lesson Assistant"
              : "General Study Assistant"}
          </span>
        </header>

        <div className="messages-container">
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`message-row ${msg.role === "user" ? "user-row" : "ai-row"
                }`}
            >
              <div className="message-bubble">{msg.text}</div>
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="message-row ai-row"
            >
              <div className="message-bubble typing-bubble">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        <div className="chat-input-wrapper">
          <div className="input-container">
            <input
              type="text"
              placeholder={
                courseId && lessonId
                  ? "Ask anything about this lesson..."
                  : "Ask any study-related question..."
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              disabled={isTyping}
            />
            <button
              onClick={handleSend}
              disabled={isTyping || !input.trim()}
              className={`send-btn ${isTyping ? "loading" : ""}`}
            >
              {isTyping ? "⌛" : "➤"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorAI;
