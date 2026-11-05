import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../../api/axios";
import "../../styles/student/CourseDetails.css"; // Ensure this CSS path matches your actual path

const CourseDetails = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourseDetails();
  }, [courseId]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/courses/${courseId}`);
      setCourse(res.data?.data || null);
    } catch (err) {
      console.error("COURSE FETCH ERROR 👉", err);
      setError("Failed to load course details. It might have been removed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      setEnrolling(true);
      // Backend enrollment call
      await API.post(`/enrollments/${courseId}`);
      // On success, redirect to my path
      navigate("/student/my-path");
    } catch (err) {
      console.error("ENROLLMENT ERROR 👉", err);
      // If error is 400 (Already enrolled), we can just navigate them anyway
      if (err.response && err.response.status === 400) {
        navigate("/student/my-path");
      } else {
        alert("Enrollment failed. Please try again later.");
      }
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="loading-state" style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading course details...</div>;
  if (error || !course) return <div className="error-state" style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{error || "Course not found."}</div>;

  return (
    <div className="course-details-wrapper">
      <div className="course-details-container">
        
        {/* HEADER SECTION */}
        <motion.header 
          className="cd-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="cd-header-image">
            <img 
              src={course.thumbnail ? (course.thumbnail.startsWith('http') ? course.thumbnail : `${import.meta.env.VITE_API_URL}${course.thumbnail}`) : "/course-placeholder.jpg"} 
              alt={course.title} 
            />
          </div>
          
          <div className="cd-header-content">
            <h1 className="cd-title">{course.title}</h1>
            <p className="cd-instructor">Created by <span>{course.instructor?.name || "Instructor"}</span></p>
            <p className="cd-desc">{course.description || "No description provided for this course."}</p>
            
            <div className="cd-actions">
              <button 
                className="enroll-btn"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? "Enrolling..." : "Enroll Now"}
              </button>
              <span className="cd-price">
                {course.price === 0 ? "Free" : `₹${course.price}`}
              </span>
            </div>
          </div>
        </motion.header>

        {/* SYLLABUS SECTION */}
        <motion.section 
          className="cd-body"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2>Course Syllabus</h2>
          
          {course.modules && course.modules.length > 0 ? (
            <div className="module-list">
              {course.modules.map((mod, idx) => (
                <div key={mod._id || idx} className="module-item">
                  <div className="module-header">
                    <span>Module {idx + 1}: {mod.title}</span>
                    <span style={{ fontSize: '0.9em', color: '#94a3b8' }}>
                      {mod.lessons?.length || 0} Lessons
                    </span>
                  </div>
                  
                  {mod.lessons && mod.lessons.length > 0 && (
                    <div className="lesson-list">
                      {mod.lessons.map((lesson, lIdx) => (
                        <div key={lesson._id || lIdx} className="lesson-item">
                          <span className="lesson-icon">
                            {lesson.type === 'video' ? '▶️' : lesson.type === 'pdf' ? '📄' : '📝'}
                          </span>
                          <span>{lesson.title}</span>
                          <span style={{ marginLeft: 'auto', fontSize: '0.85em', color: '#64748b' }}>
                            {lesson.duration ? `${lesson.duration} min` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#9ca3af' }}>No modules available for this course yet.</p>
          )}
        </motion.section>

      </div>
    </div>
  );
};

export default CourseDetails;
