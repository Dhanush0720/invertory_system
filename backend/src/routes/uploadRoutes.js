const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const AuditLog = require('../models/AuditLog');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    // allow PDFs and images
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDFs and images are allowed!'));
    }
  }
});

// POST /api/uploads/item/:id - Upload document to an item
router.post('/item/:id', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const docUrl = `/uploads/${req.file.filename}`;
    item.documentUrl = docUrl;
    await item.save();

    // Log the upload
    await AuditLog.create({
      item: item._id,
      performedBy: req.user.userId, // Requires auth middleware before this route
      actionType: 'DOCUMENT_UPLOADED',
      notes: `Uploaded ${req.file.originalname}`
    });

    res.json({ message: 'Document uploaded successfully', documentUrl: docUrl });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || 'File upload failed' });
  }
});

module.exports = router;
