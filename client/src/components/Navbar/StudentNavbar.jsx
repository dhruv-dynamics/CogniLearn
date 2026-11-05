import { useState, useContext } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext, useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import "../../styles/Student/StudentNavbar.css";

const StudentNavbar = () => {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);
  const { logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showCertificatesModal, setShowCertificatesModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || "");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleEditProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.put("/user/profile", { name: editName });
      setUser({ ...user, name: editName });
      sessionStorage.setItem("user", JSON.stringify({ ...user, name: editName }));
      setShowEditModal(false);
      alert("Profile updated successfully!");
    } catch (error) {
      alert("Failed to update profile: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    try {
      setLoading(true);
      await API.put("/user/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordModal(false);
      alert("Password changed successfully!");
    } catch (error) {
      alert("Failed to change password: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await API.get("/user/certificates");
      setCertificates(response.data.certificates);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadCertificate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("certificate", file);
    formData.append("title", prompt("Enter certificate title:") || "Certificate");
    formData.append("description", prompt("Enter certificate description:") || "");

    try {
      setLoading(true);
      await API.post("/certificates/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      fetchCertificates();
      alert("Certificate uploaded successfully!");
    } catch (error) {
      alert("Failed to upload certificate: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCertificate = async (certificateId) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;
    
    try {
      setLoading(true);
      await API.delete(`/certificates/${certificateId}`);
      fetchCertificates();
      alert("Certificate deleted successfully!");
    } catch (error) {
      alert("Failed to delete certificate: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = (fileUrl, fileName) => {
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    link.click();
  };

  return (
    <>
      <nav className="student-navbar">
        {/* Branding / Logo */}
        <div className="student-navbar-left">
          {/* 🔥 Dashboard link ko Discover se replace kar diya */}
          <Link to="/discover" className="logo">
            Cogni<span>Learn</span> 🎓
          </Link>
        </div>

        {/* Navigation Links */}
        <div className="student-navbar-right">
          <NavLink 
            to="/discover" 
            className={({ isActive }) => isActive ? "student-nav-link active" : "student-nav-link"}
          >
            Discover
          </NavLink>

          <NavLink 
            to="/student/my-path" 
            className={({ isActive }) => isActive ? "student-nav-link active" : "student-nav-link"}
          >
            My Path
          </NavLink>

          <NavLink 
            to="/student/the-vault" 
            className={({ isActive }) => isActive ? "student-nav-link active" : "student-nav-link"}
          >
            The Vault
          </NavLink>

          <NavLink 
            to="/student/mentor-ai" 
            className={({ isActive }) => isActive ? "student-nav-link mentor-ai-link active" : "student-nav-link mentor-ai-link"}
          >
            Mentor AI ✨
          </NavLink>

          {/* Profile Section with Dropdown */}
          <div className="profile-container" style={{ position: "relative" }}>
            <motion.div 
              className="avatar-circle"
              onClick={() => setShowDropdown(!showDropdown)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "S"}
            </motion.div>

            <AnimatePresence>
              {showDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="profile-dropdown"
                >
                  <div className="dropdown-header">
                    <p className="user-name">{user?.name || "Student"}</p>
                    <p className="user-email">{user?.email || "student@example.com"}</p>
                  </div>
                  <hr className="dropdown-divider" />
                  
                  <Link 
                    to="/student/certificates" 
                    onClick={() => setShowDropdown(false)}
                    className="dropdown-item-btn"
                  >
                    📜 My Certificates
                  </Link>
                  
                  <button 
                    className="dropdown-item-btn" 
                    onClick={() => {
                      setShowDropdown(false);
                      setShowEditModal(true);
                      setEditName(user?.name || "");
                    }}
                  >
                     ✍️ Edit Profile
                  </button>
                  
                  <button 
                    className="dropdown-item-btn" 
                    onClick={() => {
                      setShowDropdown(false);
                      setShowPasswordModal(true);
                      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                    }}
                  >
                     🔒 Change Password
                  </button>

                  <button className="dropdown-logout-btn" onClick={logout}>
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Edit Profile</h3>
              <form onSubmit={handleEditProfile}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Update"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPasswordModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowPasswordModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Change Password</h3>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                    minLength="6"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                    minLength="6"
                  />
                </div>
                <div className="modal-buttons">
                  <button type="button" onClick={() => setShowPasswordModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={loading}>
                    {loading ? "Changing..." : "Change Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificates Modal */}
      <AnimatePresence>
        {showCertificatesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={() => setShowCertificatesModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content certificates-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>My Certificates</h3>
              
              <div className="certificates-header">
                <label className="upload-btn">
                  Upload Certificate
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUploadCertificate}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="certificates-list">
                {certificates.length === 0 ? (
                  <p className="no-certificates">No certificates uploaded yet.</p>
                ) : (
                  certificates.map((cert) => (
                    <div key={cert._id} className="certificate-item">
                      <div className="certificate-info">
                        <h4>{cert.title}</h4>
                        {cert.description && (
                          <p>{cert.description}</p>
                        )}
                        <div className="certificate-meta">
                          <span>File: {cert.fileName}</span>
                          <span>Size: {(cert.fileSize / 1024).toFixed(1)} KB</span>
                          <span>Uploaded: {new Date(cert.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="certificate-actions">
                        <button
                          onClick={() => handleDownloadCertificate(cert.fileUrl, cert.fileName)}
                          className="view-btn"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteCertificate(cert._id)}
                          className="delete-btn"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="modal-buttons">
                <button 
                  type="button" 
                  onClick={() => setShowCertificatesModal(false)}
                  className="close-btn"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StudentNavbar;
