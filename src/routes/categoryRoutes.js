const express = require("express");
const router = express.Router();
const {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController");
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const { uploadCategoryImages } = require("../middleware/upload");

router.get("/", getCategories);
router.get("/:idOrSlug", getCategoryByIdOrSlug);

// Admin Routes
router.post(
  "/",
  authenticateUser,
  requireAdmin,
  uploadCategoryImages.single("image"),
  createCategory
);
router.patch(
  "/:id",
  authenticateUser,
  requireAdmin,
  uploadCategoryImages.single("image"),
  updateCategory
);
router.delete("/:id", authenticateUser, requireAdmin, deleteCategory);

module.exports = router;
