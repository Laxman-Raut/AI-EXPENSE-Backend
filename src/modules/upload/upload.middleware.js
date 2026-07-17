const multer = require("multer");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB — accommodates PDF receipts (PDFs can be several MB)
  },
});

module.exports = upload;