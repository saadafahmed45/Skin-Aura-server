const express = require("express");
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
} = require("../controllers/wishlistController");
const { authenticateUser } = require("../middleware/auth");

router.use(authenticateUser);

router.get("/", getWishlist);
router.post("/:productId", addToWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;
