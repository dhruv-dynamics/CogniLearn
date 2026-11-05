import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import "../../styles/Instructor/MyContent.css";

const MyContent = () => {
  const navigate = useNavigate();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructorCourses();
  }, []);

  const fetchInstructorCourses = async () => {
    try {
      const res = await API.get("/courses/instructor");
      if (res.data.success) {
        setCourses(res.data.data);
      }
    } catch (err) {
      console.error("Fetch Courses Error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course forever?")) {
      try {
        const res = await API.delete(`/courses/${courseId}`);
        if (res.data.success) {
          setCourses(prev => prev.filter(c => c._id !== courseId));
        }
      } catch (err) {
        console.error("Delete Error", err);
        alert("Failed to delete the course.");
      }
    }
  };

  return (
    <div className="my-content-wrapper">
      <main className="my-content-container">
        
        {/* 🌟 Header Section */}
        <header className="content-page-header">
          <div className="header-info">
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              My Content 📚
            </motion.h1>
            <p className="subtitle">Manage your curriculum and track course performance.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            className="add-content-btn" 
            onClick={() => navigate("/instructor/create")}
          >
            + New Course
          </motion.button>
        </header>

        {/* 🔍 Filter & Search Bar */}
        <div className="content-controls glass-effect">
          <div className="search-wrapper">
            <input type="text" placeholder="Filter by course title..." className="content-search-input" />
          </div>
          <div className="filter-wrapper">
            <select className="content-status-select">
              <option>All Status</option>
              <option>Published</option>
              <option>Draft</option>
            </select>
          </div>
        </div>

        {/* 📋 Courses Management Table */}
        <div className="content-table-card glass-effect">
          {loading ? (
            <p style={{textAlign: 'center', padding: '20px'}}>Loading courses...</p>
          ) : courses.length === 0 ? (
            <p style={{textAlign: 'center', padding: '20px'}}>No uploaded courses yet.</p>
          ) : (
            <table className="content-data-table">
              <thead>
                <tr>
                  <th>Course Details</th>
                  <th>Status</th>
                  <th>Students</th>
                  <th>Price</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id} className="content-row">
                    <td className="course-main-cell">
                      <p className="course-name-text">{course.title}</p>
                      <p className="update-date">Created: {new Date(course.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td>
                      <span className={`status-label ${course.isPublished ? 'published' : 'draft'}`}>
                        {course.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="learner-count">- Learners</td>
                    <td className="price-tag-text">{course.price === 0 ? "Free" : `₹${course.price}`}</td>
                    <td className="actions-cell-group">
                      <button className="action-icon edit" title="Edit Content" onClick={() => navigate(`/instructor/course/${course._id}/manage`)}>✏️</button>
                      <button className="action-icon delete" title="Remove Content" onClick={() => handleDelete(course._id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  );
};

export default MyContent;