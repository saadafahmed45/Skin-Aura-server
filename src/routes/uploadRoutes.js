const express = require("express");
const router = express.Router();
const { uploadImages } = require("../controllers/uploadController");
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const { uploadProductImages } = require("../middleware/upload");

// Multer middleware wrapper that catches multer errors gracefully and permits JSON fallback
const handleUploadMiddleware = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";
  if (contentType.includes("multipart/form-data")) {
    uploadProductImages.array("images", 10)(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "File upload validation error.",
        });
      }
      next();
    });
  } else {
    // Pass directly to controller for JSON base64 handling
    next();
  }
};

router.post(
  "/",
  authenticateUser,
  requireAdmin,
  handleUploadMiddleware,
  uploadImages
);

module.exports = router;
