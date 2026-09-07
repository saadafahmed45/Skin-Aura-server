const express = require("express");
const router = express.Router();
const {
  applyCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon,
} = require("../controllers/couponController");
const { authenticateUser, requireAdmin } = require("../middleware/auth");

router.post("/apply", applyCoupon);

// Admin Routes
router.get("/", authenticateUser, requireAdmin, getCoupons);
router.post("/", authenticateUser, requireAdmin, createCoupon);
router.delete("/:id", authenticateUser, requireAdmin, deleteCoupon);

module.exports = router;
