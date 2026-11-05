import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import API from "../../api/axios";
import "../../styles/Instructor/AIAnalytics.css";

const AIAnalytics = () => {
  const [data, setData] = useState({
    autonomyRate: 100,
    topDoubts: [],
    recentDoubts: [],
    totalDoubtsAnalyzed: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  const toggleExpand = (index) => {
    setExpandedId(expandedId === index ? null : index);
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await API.get("/instructor/ai-analytics");
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("AI Analytics fetch failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-analytics-wrapper">
      <header className="analytics-header">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          AI Insights Hub 🧠
        </motion.h1>
        <p className="subtitle">Understanding student patterns through Mentor AI data.</p>
      </header>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: "50px" }}>Loading Analytics...</div>
      ) : data.totalDoubtsAnalyzed === 0 ? (
        <div style={{ textAlign: "center", marginTop: "50px", padding: "40px", background: "rgba(255,255,255,0.05)", borderRadius: "10px" }}>
          <h2>No Data Yet 🤫</h2>
          <p style={{ opacity: 0.7, marginTop: "10px" }}>Students haven't asked the AI Mentor any doubts regarding your courses yet. Once they do, analytics will appear here!</p>
        </div>
      ) : (
        <div className="analytics-grid">
          {/* AI Performance Card */}
          <section className="glass-card ai-perf">
            <h3>AI Autonomy Rate</h3>
            <div className="gauge-container">
              <div className="gauge-fill" style={{ "--target": `${data.autonomyRate}%` }}></div>
              <span className="gauge-value">{data.autonomyRate}%</span>
            </div>
            <p>Doubts resolved by AI without human intervention.</p>
          </section>

          {/* Top Doubts List */}
          <section className="glass-card doubts-list">
            <h3>Trending Doubts 🔥</h3>
            {data.topDoubts.length > 0 ? (
              data.topDoubts.map((doubt, i) => (
                <div key={i} className="doubt-item">
                  <span className="topic">{doubt.topic}</span>
                  <span className="count">{doubt.count} asks</span>
                  <span className={`trend ${doubt.trend}`}>{doubt.trend === "up" ? "↑" : "↓"}</span>
                </div>
              ))
            ) : (
              <p style={{ opacity: 0.6, fontSize: "0.9rem" }}>Not enough data to extract trending doubts.</p>
            )}
          </section>
        </div>
      )}

      {!loading && data.recentDoubts?.length > 0 && (
        <section className="glass-card recent-conversations-section" style={{ marginTop: "30px" }}>
          <h3 style={{ marginBottom: "20px" }}>Recent Student Conversations 💬</h3>
          <div className="conversations-list">
            {data.recentDoubts.map((doubt, idx) => (
              <div 
                key={idx} 
                className={`conversation-card ${expandedId === idx ? "expanded" : ""}`}
                style={{ 
                  background: "rgba(255,255,255,0.05)", 
                  padding: "15px", 
                  borderRadius: "8px", 
                  marginBottom: "15px",
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.1)"
                }}
                onClick={() => toggleExpand(idx)}
              >
                <div className="conversation-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: "0 0 5px 0", fontSize: "1rem" }}>{doubt.student?.name || "Student"}</h4>
                    <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>
                      Course: {doubt.course?.title || "General"} | {new Date(doubt.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "bold", opacity: 0.8 }}>
                    {expandedId === idx ? "−" : "+"}
                  </div>
                </div>
                
                <div style={{ marginTop: "10px" }}>
                  <p style={{ margin: 0, fontWeight: "500", opacity: 0.9 }}>Q: {expandedId === idx ? doubt.question : (doubt.question.length > 80 ? doubt.question.substring(0, 80) + '...' : doubt.question)}</p>
                </div>

                {expandedId === idx && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: "auto" }} 
                    style={{ marginTop: "15px", padding: "15px", background: "rgba(0,0,0,0.2)", borderRadius: "6px" }}
                  >
                    <strong style={{ color: "#a855f7" }}>Mentor AI ✨:</strong>
                    <p style={{ margin: "10px 0 0 0", fontSize: "0.95rem", lineHeight: "1.5", opacity: 0.9, whiteSpace: "pre-wrap" }}>
                      {doubt.aiAnswer || "No AI response recorded."}
                    </p>
                  </motion.div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default AIAnalytics;