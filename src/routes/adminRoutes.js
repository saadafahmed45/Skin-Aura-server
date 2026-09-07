const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAdminOrders,
  updateOrderStatus,
  getAdminCustomers,
  toggleCustomerStatus,
} = require("../controllers/adminController");
const { authenticateUser, requireAdmin } = require("../middleware/auth");

router.use(authenticateUser, requireAdmin);

router.get("/stats", getDashboardStats);
router.get("/orders", getAdminOrders);
router.patch("/orders/:id", updateOrderStatus);
router.get("/customers", getAdminCustomers);
router.patch("/customers/:id/status", toggleCustomerStatus);

module.exports = router;
