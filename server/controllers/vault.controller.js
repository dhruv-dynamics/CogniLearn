import VaultItem from "../models/Vault.js";

// Fetch all vault items for a student
export const getVaultItems = async (req, res, next) => {
  try {
    const studentId = req.user._id;
    const items = await VaultItem.find({ student: studentId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Vault items retrieved successfully",
      data: items,
    });
  } catch (error) {
    console.error("GET VAULT ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create a new text note
export const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const studentId = req.user._id;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const note = await VaultItem.create({
      student: studentId,
      type: "Note",
      title,
      content: content || "",
    });

    res.status(201).json({
      success: true,
      message: "Note created successfully",
      data: note,
    });
  } catch (error) {
    console.error("CREATE NOTE ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update an existing note
export const updateNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const studentId = req.user._id;

    const note = await VaultItem.findOne({ _id: id, student: studentId });
    if (!note) {
      return res.status(404).json({ success: false, message: "Note not found" });
    }

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    await note.save();

    res.status(200).json({
      success: true,
      message: "Note updated successfully",
      data: note,
    });
  } catch (error) {
    console.error("UPDATE NOTE ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Upload a new file piece (PDF/Docs)
export const uploadFile = async (req, res, next) => {
  try {
    const { title } = req.body;
    const studentId = req.user._id;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const newFile = await VaultItem.create({
      student: studentId,
      type: "File",
      title,
      fileUrl: req.file.path, // Direct Absolute Cloudinary URL
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: newFile,
    });
  } catch (error) {
    console.error("UPLOAD FILE ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete a vault item (note or file)
export const deleteItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const item = await VaultItem.findOneAndDelete({ _id: id, student: studentId });

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }

    // Ideally if it's a File we would fs.unlinkSync the fileUrl here, but we will skip for now to avoid server breaking
    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ITEM ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
