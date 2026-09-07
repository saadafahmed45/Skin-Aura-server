const express = require("express");
const router = express.Router();
const {
  getProductReviews,
  createReview,
  getAllReviews,
  toggleApproveReview,
  deleteReview,
} = require("../controllers/reviewController");
const { authenticateUser, requireAdmin } = require("../middleware/auth");

router.get("/product/:productId", getProductReviews);
router.post("/", authenticateUser, createReview);

// Admin Routes
router.get("/", authenticateUser, requireAdmin, getAllReviews);
router.patch("/:id/approve", authenticateUser, requireAdmin, toggleApproveReview);
router.delete("/:id", authenticateUser, requireAdmin, deleteReview);

module.exports = router;
