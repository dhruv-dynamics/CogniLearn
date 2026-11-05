import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../../api/axios";
import "../../styles/student/TheVault.css";

const TheVault = () => {
  const [activeTab, setActiveTab] = useState("Notes"); // "Notes" or "Files"
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Note Form
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);

  // File Form
  const [fileTitle, setFileTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchVaultItems();
  }, []);

  const fetchVaultItems = async () => {
    try {
      setLoading(true);
      const res = await API.get("/vault");
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error("Fetch Vault Error:", err);
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- NOTES ---------------- */
  const handleOpenNoteModal = (note = null) => {
    if (note) {
      setEditingNoteId(note._id);
      setNoteTitle(note.title);
      setNoteContent(note.content);
    } else {
      setEditingNoteId(null);
      setNoteTitle("");
      setNoteContent("");
    }
    setIsNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    if (!noteTitle.trim()) return alert("Title is required!");
    try {
      setSubmitting(true);
      if (editingNoteId) {
        // Update existing
        const res = await API.put(`/vault/note/${editingNoteId}`, {
          title: noteTitle,
          content: noteContent,
        });
        if (res.data.success) {
          setItems(items.map(i => i._id === editingNoteId ? res.data.data : i));
        }
      } else {
        // Create new
        const res = await API.post("/vault/note", {
          title: noteTitle,
          content: noteContent,
        });
        if (res.data.success) {
          setItems([res.data.data, ...items]);
        }
      }
      setIsNoteModalOpen(false);
    } catch (err) {
      console.error("Save Note Error:", err);
      alert("Failed to save note.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- FILES ---------------- */
  const handleFileUpload = async () => {
    if (!fileTitle.trim()) return alert("Title is required!");
    if (!selectedFile) return alert("Please select a file!");

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("title", fileTitle);
      formData.append("file", selectedFile);

      const res = await API.post("/vault/file", formData);
      if (res.data.success) {
        setItems([res.data.data, ...items]);
        setIsFileModalOpen(false);
        setFileTitle("");
        setSelectedFile(null);
      }
    } catch (err) {
      console.error("Upload File Error:", err);
      alert("Failed to upload file.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------- DELETE ---------------- */
  const handleDelete = async (id, itemType) => {
    if (!window.confirm(`Are you sure you want to delete this ${itemType}?`)) return;
    try {
      const res = await API.delete(`/vault/${id}`);
      if (res.data.success) {
        setItems(items.filter(i => i._id !== id));
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete item.");
    }
  };

  /* ---------------- RENDER HELPERS ---------------- */
  const filteredItems = items.filter(item => 
    activeTab === "Notes" ? item.type === "Note" : item.type === "File"
  );

  return (
    <div className="vault-wrapper">
      <header className="vault-header">
        <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          The <span>Vault</span> 🔐
        </motion.h1>
        <p>Manage your personal notes and study materials securely.</p>
      </header>

      {/* TABS */}
      <div className="vault-tabs">
        <button 
          className={activeTab === "Notes" ? "active" : ""}
          onClick={() => setActiveTab("Notes")}
        >
          📝 My Notes
        </button>
        <button 
          className={activeTab === "Files" ? "active" : ""}
          onClick={() => setActiveTab("Files")}
        >
          📂 My Files
        </button>
      </div>

      {/* ACTION BAR */}
      <div className="vault-action-bar">
        {activeTab === "Notes" ? (
          <button className="new-note-btn" onClick={() => handleOpenNoteModal()}>+ Write a Note</button>
        ) : (
          <button className="upload-btn" onClick={() => { setFileTitle(""); setSelectedFile(null); setIsFileModalOpen(true); }}>+ Upload PDF/File</button>
        )}
      </div>

      {/* ITEMS GRID */}
      {loading ? (
        <div className="vault-loading">Opening the Vault...</div>
      ) : (
        <div className="vault-grid">
          <AnimatePresence>
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <motion.div 
                  key={item._id} 
                  className="vault-card"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                >
                  <div className="vault-card-header">
                    <div className={`icon-box ${item.type === 'Note' ? 'note-icon' : 'file-icon'}`}>
                      {item.type === "Note" ? "📝" : "📄"}
                    </div>
                    <h3>{item.title}</h3>
                  </div>

                  <div className="vault-card-body">
                    {item.type === "Note" ? (
                      <p>{item.content || "Empty note..."}</p>
                    ) : (
                      <p style={{fontFamily: 'monospace', color: '#64748b'}}>Document (PDF/Resource)</p>
                    )}
                  </div>

                  <div className="vault-card-actions">
                    {item.type === "Note" ? (
                      <button className="vault-icon-btn edit" title="Edit Note" onClick={() => handleOpenNoteModal(item)}>✏️</button>
                    ) : (
                      <a href={item.fileUrl && item.fileUrl.startsWith('http') ? item.fileUrl : `${import.meta.env.VITE_API_URL}${item.fileUrl}`} target="_blank" rel="noreferrer" className="vault-icon-btn view" title="View File">👁️</a>
                    )}
                    <button className="vault-icon-btn delete" title="Delete" onClick={() => handleDelete(item._id, item.type)}>🗑️</button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div className="empty-vault" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {activeTab === "Notes" 
                  ? "Your notebook is empty. Start writing!" 
                  : "No files uploaded. Store your PDFs here securely."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* NOTE MODAL */}
      <AnimatePresence>
        {isNoteModalOpen && (
          <motion.div className="vault-modal-overlay" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="vault-modal" initial={{y: 50}} animate={{y: 0}} exit={{y: 50}}>
              <h2>{editingNoteId ? "Edit Note" : "New Note"}</h2>
              
              <div className="vault-form-group">
                <label>Title</label>
                <input type="text" placeholder="Note Title" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
              </div>
              
              <div className="vault-form-group">
                <label>Content</label>
                <textarea rows="6" placeholder="Start typing your notes here..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)}></textarea>
              </div>

              <div className="vault-modal-actions">
                <button className="cancel-btn" onClick={() => setIsNoteModalOpen(false)} disabled={submitting}>Cancel</button>
                <button className="submit-btn" onClick={handleSaveNote} disabled={submitting}>{submitting ? "Saving..." : "Save Note"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FILE UPLOAD MODAL */}
      <AnimatePresence>
        {isFileModalOpen && (
          <motion.div className="vault-modal-overlay" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}>
            <motion.div className="vault-modal" initial={{y: 50}} animate={{y: 0}} exit={{y: 50}}>
              <h2>Upload File</h2>
              
              <div className="vault-form-group">
                <label>Document Title</label>
                <input type="text" placeholder="e.g. Chapter 1 Notes.pdf" value={fileTitle} onChange={(e) => setFileTitle(e.target.value)} />
              </div>
              
              <div className="vault-form-group">
                <label>Select File</label>
                <div className="file-drop-area">
                  <input type="file" accept="application/pdf,image/*" onChange={(e) => setSelectedFile(e.target.files[0])} style={{width: '100%'}}/>
                </div>
              </div>

              <div className="vault-modal-actions">
                <button className="cancel-btn" onClick={() => setIsFileModalOpen(false)} disabled={submitting}>Cancel</button>
                <button className="submit-btn" onClick={handleFileUpload} disabled={submitting}>{submitting ? "Uploading..." : "Upload File"}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default TheVault;