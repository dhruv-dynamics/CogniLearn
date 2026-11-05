import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Instructor/InstructorNavbar.css";

const InstructorNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef();
  const { user, logout } = useAuth();

  const [showProfileDrop, setShowProfileDrop] = useState(false);

  // ✅ Better active checker (supports nested routes)
  const isActive = (path) => location.pathname.startsWith(path);

  // ✅ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowProfileDrop(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Logout handler
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="ins-navbar glass-effect">
      {/* LEFT */}
      <div className="ins-nav-left">
        <div
          className="ins-logo"
          onClick={() => navigate("/instructor/dashboard")}
        >
          CogniLearn <span className="ins-tag">INSTRUCTOR</span>
        </div>
      </div>

      {/* CENTER */}
      <div className="ins-nav-center">
        <Link
          to="/instructor/dashboard"
          className={`ins-link ${isActive("/instructor/dashboard") ? "active" : ""}`}
        >
          Dashboard
        </Link>

        <Link
          to="/instructor/MyContent"
          className={`ins-link ${isActive("/instructor/MyContent") ? "active" : ""}`}
        >
          My Content
        </Link>

        <Link
          to="/instructor/analytics"
          className={`ins-link ${isActive("/instructor/analytics") ? "active" : ""}`}
        >
          AI Analytics
        </Link>

        <Link
          to="/instructor/students"
          className={`ins-link ${isActive("/instructor/students") ? "active" : ""}`}
        >
          Learners
        </Link>
      </div>

      {/* RIGHT */}
      <div className="ins-nav-right">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="ins-create-btn"
          onClick={() => navigate("/instructor/create")}
        >
          <span className="plus-icon">+</span> Create
        </motion.button>

        {/* PROFILE */}
        <div
          className="ins-profile-wrapper"
          ref={dropdownRef}
        >
          <div
            className="ins-avatar-badge"
            onClick={() => setShowProfileDrop((prev) => !prev)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              color: "#fff",
              cursor: "pointer",
              border: "2px solid rgba(6, 182, 212, 0.5)",
              boxShadow: "0 0 10px rgba(6, 182, 212, 0.3)"
            }}
          >
            {user?.name ? user.name.charAt(0).toUpperCase() : "T"}
          </div>

          <AnimatePresence>
            {showProfileDrop && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="ins-dropdown glass-effect"
              >
                <div className="drop-header">
                  <p className="user-name">{user?.name || "Teacher"}</p>
                  <p className="user-email">{user?.email || "instructor@cognilearn.com"}</p>
                  <span style={{
                    display: "inline-block",
                    marginTop: "4px",
                    fontSize: "0.7rem",
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: "rgba(6, 182, 212, 0.2)",
                    color: "#06b6d4"
                  }}>
                    Instructor Account
                  </span>
                </div>

                <hr />

                <Link to="/instructor/profile">
                  Instructor Profile
                </Link>

                <Link
                  to="/discover"
                  className="switch-mode"
                >
                  Switch to Student View
                </Link>

                <button
                  className="logout-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default InstructorNavbar;
