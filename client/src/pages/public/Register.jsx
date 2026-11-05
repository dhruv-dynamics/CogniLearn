import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import "../../styles/public/Login.css";

const Register = () => {
  const { login } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    try {
      const res = await API.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      // 🔥 Auto login after successful register
      login(res.data.data.user, res.data.data.token);

      // 🎯 REDIRECT LOGIC UPDATED
      if (res.data.data.user.role === "instructor") {
        navigate("/instructor/dashboard");
      } else {
        // Dashboard ki jagah ab student seedha Discover page par jayega
        navigate("/discover"); 
      }

    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="blob"></div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.8 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.5 }}
        className="login-card-wrapper"
      >
        <h2 className="login-title">Create Account</h2>

        <form className="login-card" onSubmit={handleRegister}>
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="error-message"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="input-group">
            <input
              name="name"
              type="text"
              placeholder="Full Name"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              name="email"
              type="email"
              placeholder="Email Address"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              name="password"
              type="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              name="confirmPassword"
              type="password"
              placeholder="Confirm Password"
              onChange={handleChange}
              required
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            disabled={loading}
          >
            {loading ? <div className="spinner"></div> : "Sign Up"}
          </motion.button>

          <p className="login-register-text">
            Already have an account?{" "}
            <Link to="/login" className="Register-link">Login here</Link>
          </p>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;