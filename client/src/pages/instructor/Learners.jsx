// Learners.jsx (Updated)
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import "../../styles/Instructor/Learners.css";

const Learners = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  useEffect(() => {
    fetchLearners();
  }, []);

  const fetchLearners = async () => {
    try {
      const res = await API.get("/instructor/learners");
      if (res.data.success) {
        // Group by studentId
        const grouped = res.data.data.reduce((acc, curr) => {
          if (!acc[curr.studentId]) {
            acc[curr.studentId] = {
              studentId: curr.studentId,
              name: curr.name,
              email: curr.email,
              enrollments: []
            };
          }
          acc[curr.studentId].enrollments.push({
            enrollmentId: curr._id,
            courseTitle: curr.course,
            progress: curr.progress,
            enrolledAt: curr.enrolledAt
          });
          return acc;
        }, {});
        
        setStudents(Object.values(grouped));
      }
    } catch (error) {
      console.error("Failed to fetch learners", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (enrollmentId, courseTitle, studentName) => {
    if (!window.confirm(`Are you sure you want to revoke ${studentName}'s access to ${courseTitle}?`)) return;

    try {
      await API.delete(`/instructor/learners/${enrollmentId}`);
      
      // Update local state without fetching again
      setStudents(prevStudents => {
        return prevStudents.map(student => {
          if (student.studentId === selectedStudent.studentId) {
            return {
              ...student,
              enrollments: student.enrollments.filter(e => e.enrollmentId !== enrollmentId)
            };
          }
          return student;
        }).filter(student => student.enrollments.length > 0); 
        // Completely remove student if they have 0 courses left
      });

      // Update currently open modal state
      setSelectedStudent(prev => {
        const remaining = prev.enrollments.filter(e => e.enrollmentId !== enrollmentId);
        if (remaining.length === 0) return null; // Close modal if no enrollments left
        return { ...prev, enrollments: remaining };
      });

    } catch (error) {
      console.error("Failed to revoke access", error);
      alert(error.response?.data?.message || "Error revoking access");
    }
  };

  // Helper config for calculating total overall progress across specific student's courses
  const getOverallProgress = (enrollments) => {
    if(enrollments.length === 0) return 0;
    const total = enrollments.reduce((sum, enr) => sum + enr.progress, 0);
    return Math.round(total / enrollments.length);
  };

  return (
    <div className="learners-wrapper">
      <header className="section-header">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          Your Learners 👥
        </motion.h1>
        <p>Manage your students and monitor their learning journey.</p>
      </header>

      <div className="learners-grid">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', width: "100%" }}>Loading Learners...</div>
        ) : students.length === 0 ? (
           <div className="empty-learners">
             <h2>No Enrollments Yet 🎓</h2>
             <p>When students enroll in your courses, they will appear here along with their real-time progress.</p>
           </div>
        ) : (
          students.map((s, idx) => (
            <motion.div 
              key={s.studentId} 
              className="learner-card"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedStudent(s)}
            >
              <div className="learner-header">
                <div className="learner-avatar">
                   {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="learner-info">
                  <h3>{s.name}</h3>
                  <p>{s.email}</p>
                </div>
              </div>
              <div className="learner-summary">
                <p><strong>{s.enrollments.length}</strong> Course(s) Enrolled</p>
                <div className="progress-container">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${getOverallProgress(s.enrollments)}%` }}></div>
                  </div>
                  <span className="progress-text">{getOverallProgress(s.enrollments)}% Avg</span>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* DETAILED STUDENT MODAL */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="modal-overlay" onClick={() => setSelectedStudent(null)}>
            <motion.div 
              className="learner-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button className="close-modal-btn" onClick={() => setSelectedStudent(null)}>✖</button>
              
              <div className="modal-header">
                <div className="modal-avatar">{selectedStudent.name.charAt(0).toUpperCase()}</div>
                <div>
                  <h2>{selectedStudent.name}</h2>
                  <a href={`mailto:${selectedStudent.email}`} className="email-link">📧 {selectedStudent.email}</a>
                </div>
              </div>

              <div className="modal-courses">
                <h3>Enrolled Courses</h3>
                <div className="modal-course-list">
                  {selectedStudent.enrollments.map((enr) => (
                    <div key={enr.enrollmentId} className="modal-course-item">
                      <div className="course-item-info">
                        <h4>{enr.courseTitle}</h4>
                        <span className="enroll-date">Started: {new Date(enr.enrolledAt).toLocaleDateString()}</span>
                        <div className="progress-container mini">
                          <div className="progress-bar-bg">
                            <div className="progress-bar-fill" style={{ width: `${enr.progress}%` }}></div>
                          </div>
                          <span className="progress-text">{enr.progress}%</span>
                        </div>
                      </div>
                      <button 
                        className="revoke-btn" 
                        onClick={() => handleRevokeAccess(enr.enrollmentId, enr.courseTitle, selectedStudent.name)}
                      >
                         Revoke Access
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Learners;