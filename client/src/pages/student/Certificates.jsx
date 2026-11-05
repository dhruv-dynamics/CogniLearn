import React, { useState, useEffect } from "react";
import API from "../../api/axios";
import "../../styles/Student/Certificates.css";

const Certificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await API.get("/user/certificates");
      setCertificates(response.data.certificates || []);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const handleUploadCertificate = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const title = prompt("Enter certificate title:") || "Certificate";
    const description = prompt("Enter certificate description:") || "";

    const formData = new FormData();
    formData.append("certificate", file);
    formData.append("title", title);
    formData.append("description", description);

    try {
      setLoading(true);
      await API.post("/certificates/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      fetchCertificates();
      alert("Certificate uploaded successfully! 📜");
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
    <div className="certificates-page-wrapper">
      <div className="certificates-container">
        {/* Header & Upload Card */}
        <div className="cert-card cert-header-card">
          <div className="cert-header-info">
            <h1>My Certificates 📜</h1>
            <p>Manage your verified credentials and learning milestones.</p>
          </div>
          <div>
            <label className="cert-upload-btn">
              <span>+ Upload Certificate</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleUploadCertificate}
                hidden
              />
            </label>
          </div>
        </div>

        {/* Certificates List Card */}
        <div className="cert-card">
          <h2 className="cert-list-title">Earned & Uploaded Credentials</h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#38bdf8" }}>
              Loading credentials...
            </div>
          ) : certificates.length === 0 ? (
            <div className="cert-empty-box">
              <div className="empty-icon">📜</div>
              <h3>No certificates found</h3>
              <p>Upload your external certifications or complete courses to unlock certificates.</p>
            </div>
          ) : (
            <div>
              {certificates.map((cert) => (
                <div key={cert._id} className="cert-item-card">
                  <div className="cert-item-info">
                    <h3 className="cert-item-title">{cert.title}</h3>
                    {cert.description && (
                      <p className="cert-item-desc">{cert.description}</p>
                    )}
                    <div className="cert-meta-row">
                      <span>📁 {cert.fileName || "document.pdf"}</span>
                      {cert.fileSize && (
                        <span>📊 {(cert.fileSize / 1024).toFixed(1)} KB</span>
                      )}
                      <span>
                        📅 {new Date(cert.createdAt || Date.now()).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="cert-actions-group">
                    <button
                      onClick={() =>
                        handleDownloadCertificate(cert.fileUrl, cert.fileName)
                      }
                      className="btn-cert-view"
                    >
                      👁️ View / Download
                    </button>
                    <button
                      onClick={() => handleDeleteCertificate(cert._id)}
                      className="btn-cert-delete"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Certificates;
