import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../../api/axios";
import "../../styles/student/MyPath.css";

const MyPath = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEnrolledCourses();
  }, []);

  const fetchEnrolledCourses = async () => {
    try {
      // Backend API call to get student's courses
      const res = await API.get("/enrollments/my-courses");
      setEnrolledCourses(res.data.data || []);
    } catch (err) {
      console.error("MY PATH FETCH ERROR 👉", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading-screen">Building your learning path...</div>;

  return (
    <div className="mypath-container">
      {/* Welcome & Stats Header */}
      <header className="mypath-header">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
        >
          My Learning <span>Path</span> 🛤️
        </motion.h1>
        <p>Pick up exactly where you left off and reach your goals.</p>
      </header>

      {enrolledCourses.length === 0 ? (
        <div className="empty-path">
          <h3>You haven't enrolled in any courses yet.</h3>
          <p>Explore the Discover page to find the perfect course for you!</p>
          <button onClick={() => navigate("/discover")} className="explore-btn">
            Explore Courses
          </button>
        </div>
      ) : (
        <div className="path-grid">
          {enrolledCourses.map((course) => (
            <motion.div 
              key={course._id} 
              className="path-card glass-effect"
              whileHover={{ scale: 1.02 }}
            >
              <div className="path-card-image">
                {course.thumbnail ? (
                   <img 
                      src={course.thumbnail.startsWith('http') ? course.thumbnail : `${import.meta.env.VITE_API_URL}${course.thumbnail}`} 
                      alt={course.title} 
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                   />
                ) : null}
                <div className="fallback-thumb" style={{ display: course.thumbnail ? 'none' : 'flex' }}>
                   {course.title.substring(0, 2).toUpperCase()}
                </div>
                <div className="progress-badge">{course.progress || 0}% Done</div>
              </div>
              
              <div className="path-card-content">
                <h4>{course.title}</h4>
                <div className="instructor-info">By {course.instructorName}</div>
                
                {/* Progress Bar */}
                <div className="path-progress-container">
                  <div 
                    className="path-progress-fill" 
                    style={{ width: `${course.progress || 0}%` }}
                  ></div>
                </div>

                <button 
                  className="resume-btn"
                  onClick={() => navigate(`/learn/course/${course._id}/lesson/${course.lastLessonId || 'start'}`)}
                >
                  {course.progress > 0 ? "Continue Learning" : "Start Learning"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPath;