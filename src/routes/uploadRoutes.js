const express = require("express");
const router = express.Router();
const { uploadImages } = require("../controllers/uploadController");
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const { uploadProductImages } = require("../middleware/upload");

router.post(
  "/",
  authenticateUser,
  requireAdmin,
  uploadProductImages.array("images", 5),
  uploadImages
);

module.exports = router;
