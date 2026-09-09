const express = require("express");
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  logout,
  getMe,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { authenticateUser } = require("../middleware/auth");
const { uploadUserAvatar } = require("../middleware/upload");

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleAuth);
router.post("/logout", logout);
router.get("/me", authenticateUser, getMe);
router.patch(
  "/profile",
  authenticateUser,
  uploadUserAvatar.single("avatar"),
  updateProfile
);
router.patch("/change-password", authenticateUser, changePassword);

module.exports = router;
