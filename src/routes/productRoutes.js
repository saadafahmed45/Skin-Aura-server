const express = require("express");
const router = express.Router();
const {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { authenticateUser, requireAdmin } = require("../middleware/auth");
const { uploadProductImages } = require("../middleware/upload");

router.get("/", getProducts);
router.get("/:idOrSlug", getProductByIdOrSlug);

// Admin Routes
router.post(
  "/",
  authenticateUser,
  requireAdmin,
  uploadProductImages.array("images", 5),
  createProduct
);
router.patch(
  "/:id",
  authenticateUser,
  requireAdmin,
  uploadProductImages.array("images", 5),
  updateProduct
);
router.delete("/:id", authenticateUser, requireAdmin, deleteProduct);

module.exports = router;
