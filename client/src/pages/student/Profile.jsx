import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import API from "../../api/axios";
import "../../styles/Student/Profile.css";

const StudentProfile = () => {
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("my-learning");
  const [courseFilter, setCourseFilter] = useState("enrolled");
  const [profileData, setProfileData] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [completedCourses, setCompletedCourses] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "" });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Fetch profile data
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [profileRes, enrolledRes, completedRes, certificatesRes] =
        await Promise.allSettled([
          API.get("/user/me"),
          API.get("/user/enrolled-courses"),
          API.get("/user/completed-courses"),
          API.get("/user/certificates"),
        ]);

      if (profileRes.status === "fulfilled" && profileRes.value.data?.user) {
        setProfileData(profileRes.value.data.user);
        setFormData({ name: profileRes.value.data.user.name || "" });
      } else if (user) {
        setProfileData(user);
        setFormData({ name: user.name || "" });
      }

      if (enrolledRes.status === "fulfilled" && enrolledRes.value.data?.courses) {
        setEnrolledCourses(enrolledRes.value.data.courses);
      }
      if (completedRes.status === "fulfilled" && completedRes.value.data?.courses) {
        setCompletedCourses(completedRes.value.data.courses);
      }
      if (
        certificatesRes.status === "fulfilled" &&
        certificatesRes.value.data?.certificates
      ) {
        setCertificates(certificatesRes.value.data.certificates);
      }
    } catch (error) {
      console.error("Failed to fetch profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  // Update profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.put("/user/profile", { name: formData.name });
      alert("Profile updated successfully! ✨");
      fetchProfileData();
    } catch (error) {
      alert(
        "Failed to update profile: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Change password
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
        newPassword: passwordData.newPassword,
      });
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      alert("Password changed successfully! 🔐");
    } catch (error) {
      alert(
        "Failed to change password: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Upload certificate
  const handleUploadCertificate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const title = prompt("Enter certificate title:") || "Certificate";
    const description = prompt("Enter certificate description:") || "";

    const data = new FormData();
    data.append("certificate", file);
    data.append("title", title);
    data.append("description", description);

    try {
      setLoading(true);
      await API.post("/certificates/upload", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchProfileData();
      alert("Certificate uploaded successfully! 📜");
    } catch (error) {
      alert(
        "Failed to upload certificate: " +
          (error.response?.data?.message || error.message)
      );
    } finally {
      setLoading(false);
    }
  };

  // Delete certificate
  const handleDeleteCertificate = async (certificateId) => {
    if (!confirm("Are you sure you want to delete this certificate?")) return;

    try {
      setLoading(true);
      await API.delete(`/certificates/${certificateId}`);
      fetchProfileData();
      alert("Certificate deleted successfully!");
    } catch (error) {
      alert(
        "Failed to delete certificate: " +
          (error.response?.data?.message || error.message)
      );
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
    <div className="student-profile-wrapper">
      <div className="student-profile-container">
        {/* Profile Header Card */}
        <div className="sp-card sp-header-card">
          <div className="sp-avatar-large">
            {profileData?.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || "S"}
          </div>
          <h1 className="sp-user-name">
            {profileData?.name || user?.name || "Student"}
          </h1>
          <p className="sp-user-email">
            {profileData?.email || user?.email || "student@cognilearn.com"}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="sp-card">
          <div className="sp-tabs">
            <button
              onClick={() => setActiveSection("my-learning")}
              className={`sp-tab-btn ${
                activeSection === "my-learning" ? "active" : ""
              }`}
            >
              📚 My Learning
            </button>
            <button
              onClick={() => setActiveSection("certificates")}
              className={`sp-tab-btn ${
                activeSection === "certificates" ? "active" : ""
              }`}
            >
              📜 Certificates ({certificates.length})
            </button>
            <button
              onClick={() => setActiveSection("account")}
              className={`sp-tab-btn ${
                activeSection === "account" ? "active" : ""
              }`}
            >
              ⚙️ Account Settings
            </button>
          </div>

          {/* TAB 1: MY LEARNING */}
          {activeSection === "my-learning" && (
            <div style={{ marginTop: "24px" }}>
              <div className="sp-sub-buttons">
                <button
                  onClick={() => setCourseFilter("enrolled")}
                  className={`sp-btn-sub enrolled ${
                    courseFilter === "enrolled" ? "active" : ""
                  }`}
                >
                  Enrolled Courses ({enrolledCourses.length})
                </button>
                <button
                  onClick={() => setCourseFilter("completed")}
                  className={`sp-btn-sub completed ${
                    courseFilter === "completed" ? "active" : ""
                  }`}
                >
                  Completed Courses ({completedCourses.length})
                </button>
              </div>

              {courseFilter === "enrolled" && (
                <div className="sp-course-list">
                  {enrolledCourses.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>
                      No active enrollments yet. Discover new courses!
                    </p>
                  ) : (
                    enrolledCourses.map((course) => (
                      <div key={course._id} className="sp-course-item">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="sp-course-thumb"
                          />
                        )}
                        <div className="sp-course-info">
                          <h4>{course.title}</h4>
                          <p>{course.description}</p>
                          <div className="sp-course-meta">
                            <span>Level: {course.level || "Beginner"}</span>
                            <span>Category: {course.category || "General"}</span>
                            <span>Instructor: {course.instructor?.name || "Educator"}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {courseFilter === "completed" && (
                <div className="sp-course-list">
                  {completedCourses.length === 0 ? (
                    <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>
                      No courses completed yet. Keep learning!
                    </p>
                  ) : (
                    completedCourses.map((course) => (
                      <div key={course._id} className="sp-course-item">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            alt={course.title}
                            className="sp-course-thumb"
                          />
                        )}
                        <div className="sp-course-info">
                          <h4>{course.title}</h4>
                          <p>{course.description}</p>
                          <div className="sp-course-meta">
                            <span>Level: {course.level}</span>
                            <span>Category: {course.category}</span>
                            <span>
                              Completed:{" "}
                              {new Date(course.completedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CERTIFICATES */}
          {activeSection === "certificates" && (
            <div style={{ marginTop: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ fontSize: "1.2rem", color: "#fff", margin: 0 }}>
                  Certificates & Credentials
                </h3>
                <label className="sp-btn-submit" style={{ cursor: "pointer" }}>
                  <span>+ Upload Certificate</span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleUploadCertificate}
                    hidden
                  />
                </label>
              </div>

              {certificates.length === 0 ? (
                <p style={{ color: "#94a3b8", textAlign: "center", padding: "30px" }}>
                  No certificates uploaded yet.
                </p>
              ) : (
                <div className="sp-course-list">
                  {certificates.map((cert) => (
                    <div key={cert._id} className="sp-course-item">
                      <div className="sp-course-info">
                        <h4>{cert.title}</h4>
                        {cert.description && <p>{cert.description}</p>}
                        <div className="sp-course-meta">
                          <span>File: {cert.fileName}</span>
                          <span>Size: {(cert.fileSize / 1024).toFixed(1)} KB</span>
                          <span>
                            Date: {new Date(cert.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          onClick={() =>
                            handleDownloadCertificate(cert.fileUrl, cert.fileName)
                          }
                          className="sp-btn-sub enrolled"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteCertificate(cert._id)}
                          className="sp-btn-sub"
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#f87171",
                            border: "1px solid rgba(239, 68, 68, 0.3)",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ACCOUNT */}
          {activeSection === "account" && (
            <div className="sp-form-section" style={{ marginTop: "24px" }}>
              {/* Edit Profile */}
              <div>
                <h3>Edit Profile Name</h3>
                <form onSubmit={handleUpdateProfile}>
                  <div className="sp-form-group">
                    <label>Full Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="sp-btn-submit"
                  >
                    {loading ? "Updating..." : "Update Profile"}
                  </button>
                </form>
              </div>

              <hr style={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

              {/* Change Password */}
              <div>
                <h3>Change Account Password</h3>
                <form onSubmit={handleChangePassword}>
                  <div className="sp-form-group">
                    <label>Current Password</label>
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          currentPassword: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="sp-form-group">
                    <label>New Password</label>
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          newPassword: e.target.value,
                        })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="sp-form-group">
                    <label>Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({
                          ...passwordData,
                          confirmPassword: e.target.value,
                        })
                      }
                      required
                      minLength={6}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="sp-btn-submit"
                  >
                    {loading ? "Changing..." : "Change Password"}
                  </button>
                </form>
              </div>

              <hr style={{ borderColor: "rgba(255, 255, 255, 0.08)" }} />

              {/* Logout */}
              <div>
                <h3>Account Session</h3>
                <button onClick={logout} className="sp-btn-logout">
                  Logout Session 🚪
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
