import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Instructor/Profile.css";

const InstructorProfile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">
        
        {/* --- LEFT SIDEBAR: Quick Info --- */}
        <aside className="profile-sidebar glass-effect">
          <div className="profile-pic-container">
            <div className="profile-avatar-large">
              {user?.name ? user.name.charAt(0).toUpperCase() : "I"}
            </div>
            <div className="online-indicator"></div>
          </div>
          <h2 className="user-name">{user?.name || "Instructor"}</h2>
          <p className="user-role">Verified Educator & Mentor</p>
          
          <div className="sidebar-stats">
            <div className="stat-item">
              <span className="stat-value">5.0 ⭐</span>
              <span className="stat-label">Rating</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">Active</span>
              <span className="stat-label">Status</span>
            </div>
          </div>

          <div className="profile-nav">
            <button className={activeTab === "personal" ? "active" : ""} onClick={() => setActiveTab("personal")}>
              👤 Personal Info
            </button>
            <button className={activeTab === "ai-settings" ? "active" : ""} onClick={() => setActiveTab("ai-settings")}>
              🤖 AI Mentor Config
            </button>
            <button className={activeTab === "social" ? "active" : ""} onClick={() => setActiveTab("social")}>
              🌐 Social Presence
            </button>
          </div>
        </aside>

        {/* --- RIGHT CONTENT AREA --- */}
        <main className="profile-main-content glass-effect">
          <AnimatePresence mode="wait">
            {activeTab === "personal" && (
              <motion.section 
                key="personal"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="tab-content"
              >
                <h3>Personal Details</h3>
                <div className="input-grid">
                  <div className="input-box">
                    <label>Full Name</label>
                    <input type="text" defaultValue={user?.name || ""} />
                  </div>
                  <div className="input-box">
                    <label>Email Address</label>
                    <input type="email" defaultValue={user?.email || ""} disabled />
                  </div>
                  <div className="input-box full-width">
                    <label>Professional Bio</label>
                    <textarea rows="4" defaultValue="Passionate about building AI-driven education tools and mentoring students." />
                  </div>
                  <div className="input-box">
                    <label>Primary Expertise</label>
                    <input type="text" defaultValue="Full Stack Development, AI & ML, Cloud Architecture" />
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === "ai-settings" && (
              <motion.section 
                key="ai-settings"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="tab-content"
              >
                <h3>🤖 AI Mentor Configuration</h3>
                <p className="tab-desc">Control how your AI Tutor interacts with students across your courses.</p>
                
                <div className="ai-config-grid">
                  <div className="config-card">
                    <label>AI Teaching Style</label>
                    <select defaultValue="Socratic (Ask questions to guide)">
                      <option>Socratic (Ask questions to guide)</option>
                      <option>Direct (Provide fast answers)</option>
                      <option>Casual (Friendly & Chill)</option>
                    </select>
                  </div>
                  <div className="config-card">
                    <label>Primary Language</label>
                    <select defaultValue="Hinglish (Best for students)">
                      <option>Hinglish (Best for students)</option>
                      <option>English (Professional)</option>
                      <option>Hindi (Pure)</option>
                    </select>
                  </div>
                  <div className="config-card full-width">
                    <label>Custom Instructions for AI</label>
                    <textarea placeholder="Tell the AI how to behave (e.g. 'Always provide code snippets with comments')" />
                  </div>
                </div>
              </motion.section>
            )}

            {activeTab === "social" && (
              <motion.section 
                key="social"
                initial={{ opacity: 0, x: 20 }} 
                animate={{ opacity: 1, x: 0 }} 
                exit={{ opacity: 0, x: -20 }}
                className="tab-content"
              >
                <h3>🌐 Connectivity & Links</h3>
                <div className="input-grid">
                  <div className="input-box">
                    <label>LinkedIn</label>
                    <input type="text" placeholder="https://linkedin.com/in/username" />
                  </div>
                  <div className="input-box">
                    <label>GitHub</label>
                    <input type="text" placeholder="https://github.com/username" />
                  </div>
                  <div className="input-box full-width">
                    <label>Portfolio / Personal Website</label>
                    <input type="text" placeholder="https://myportfolio.com" />
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>
          
          <div className="form-actions">
            <button className="save-btn" onClick={() => alert("Profile preferences saved successfully! 🎉")}>
              Save Changes 💾
            </button>
          </div>
        </main>

      </div>
    </div>
  );
};

export default InstructorProfile;
