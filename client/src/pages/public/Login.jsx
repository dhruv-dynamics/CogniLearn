import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; 
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/public/Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // setUser ki jagah login function nikaalo context se
  const { login } = useContext(AuthContext); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await API.post("/auth/login", { email, password });
      
      // res.data.data se data nikalo (check your backend response structure)
      const responseData = res.data.data; 
      const { user, token } = responseData;

      // Ye function ab sessionStorage aur state dono ko ek saath set karega
      login(user, token);

      // Redirect Logic
      if (user.role === "student") {
        navigate("/discover");
      } else {
        navigate("/instructor/dashboard");
      }

    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="blob"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }} 
        animate={{ opacity: 1, y: 0, scale: 1 }} 
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="login-card-wrapper"
      >
        <h2 className="login-title">Welcome Back</h2>

        <form className="login-card" onSubmit={handleLogin}>
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="error-message"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-group">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <motion.span 
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.8 }}
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-icon"
            >
              {showPassword ? "👁️" : "🙈"}
            </motion.span>
          </div>

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit" 
            disabled={loading}
            className={loading ? "btn-loading" : ""}
          >
            {loading ? <div className="spinner"></div> : "Login"}
          </motion.button>

          <p className="login-register-text">
            New here? <Link to="/Register" className="Register-link">Create Account</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
