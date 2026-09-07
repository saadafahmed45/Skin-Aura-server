const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("../controllers/cartController");
const { authenticateUser } = require("../middleware/auth");

router.use(authenticateUser);

router.get("/", getCart);
router.post("/", addToCart);
router.patch("/:productId", updateCartItem);
router.delete("/:productId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;
