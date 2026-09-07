const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/orderController");
const { authenticateUser } = require("../middleware/auth");

// Optional auth for checkout (allows guests or authenticated users)
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.skinaura_token;
    if (
      !token &&
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch {
    // Continue without req.user
  }
  next();
};

router.post("/", optionalAuth, createOrder);
router.get("/", optionalAuth, getMyOrders);
router.get("/:id", optionalAuth, getOrderById);
router.patch("/:id/cancel", authenticateUser, cancelOrder);

module.exports = router;
