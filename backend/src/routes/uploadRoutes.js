const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const AuditLog = require('../models/AuditLog');
const { protect, authorize } = require('../middleware/auth');
const { ALLOWED_UPLOAD_MIME_TYPES, isValidObjectId } = require('../utils/validation');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = ALLOWED_UPLOAD_MIME_TYPES[file.mimetype] || '.bin';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_UPLOAD_MIME_TYPES[file.mimetype]) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, JPEG, PNG, and WEBP files are allowed.'));
    }
  }
});

function cleanupUploadedFile(file) {
  if (file?.path && fs.existsSync(file.path)) {
    fs.unlinkSync(file.path);
  }
}

router.get('/file/:filename', protect, async (req, res) => {
  const filename = path.basename(req.params.filename);
  const absolutePath = path.join(uploadDir, filename);

  if (!absolutePath.startsWith(uploadDir)) {
    return res.status(400).json({ error: 'Invalid file path' });
  }
  if (!fs.existsSync(absolutePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  return res.sendFile(absolutePath);
});

router.post('/item/:id', protect, authorize('admin', 'staff'), upload.single('document'), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      cleanupUploadedFile(req.file);
      return res.status(400).json({ error: 'Invalid item id' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const item = await Item.findById(req.params.id);
    if (!item) {
      cleanupUploadedFile(req.file);
      return res.status(404).json({ error: 'Item not found' });
    }

    if (item.documentUrl) {
      const previousName = path.basename(item.documentUrl);
      const previousPath = path.join(uploadDir, previousName);
      if (previousPath.startsWith(uploadDir) && fs.existsSync(previousPath)) {
        fs.unlinkSync(previousPath);
      }
    }

    const docUrl = `/api/uploads/file/${req.file.filename}`;
    item.documentUrl = docUrl;
    await item.save();

    await AuditLog.create({
      item: item._id,
      performedBy: req.user._id,
      actionType: 'DOCUMENT_UPLOADED',
      notes: `Uploaded ${req.file.originalname}`
    });

    res.json({ message: 'Document uploaded successfully', documentUrl: docUrl });
  } catch (e) {
    cleanupUploadedFile(req.file);
    console.error(e);
    res.status(500).json({ error: e.message || 'File upload failed' });
  }
});

module.exports = router;
