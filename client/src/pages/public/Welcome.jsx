import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "../../styles/Public/Welcome.css";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="welcome-wrapper">
      {/* Background glow effects */}
      <div className="glow-blob"></div>
      <div className="glow-blob blue"></div>

      <main className="welcome-content">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="badge">✨ Future of Learning</div>
          
          <h1 className="welcome-title">
            Smart Learning, <br />
            <span className="text-gradient">Powered by AI</span>
          </h1>

          <p className="welcome-subtitle">
            Master new skills with personalized AI mentorship, interactive courses, and a premium learning experience tailored just for you.
          </p>
        </motion.div>

        <motion.div 
          className="welcome-actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <button 
            className="btn-primary"
            onClick={() => navigate("/register")}
          >
            Start Learning
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate("/login")}
          >
            Sign In
          </button>
        </motion.div>

        <motion.div 
          className="welcome-features"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div className="feature-box">
            <div className="f-icon">🤖</div>
            <h4>Mentor AI</h4>
            <p>24/7 personalized guidance and doubt resolution.</p>
          </div>
          <div className="feature-box">
            <div className="f-icon">⚡</div>
            <h4>Live Tracking</h4>
            <p>Real-time analytics to monitor your learning graph.</p>
          </div>
          <div className="feature-box">
            <div className="f-icon">🎓</div>
            <h4>Pro Courses</h4>
            <p>High-quality content curated by industry experts.</p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Welcome;
