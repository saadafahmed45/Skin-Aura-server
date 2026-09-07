const User = require("../models/User");
const { sendTokenResponse } = require("../utils/token");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone: phone || "",
      address: address || "",
      role: "customer",
    });

    sendTokenResponse(user, 201, res, "Account registered successfully.");
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password credentials.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password credentials.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "This account has been disabled. Please contact support.",
      });
    }

    sendTokenResponse(user, 200, res, "Logged in successfully.");
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  res.cookie("skinaura_token", "", {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    domain: process.env.COOKIE_DOMAIN || undefined,
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully.",
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user,
  });
};

// @desc    Update user profile
// @route   PATCH /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;

    if (req.file && req.file.path) {
      user.avatar = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PATCH /api/auth/change-password
// @access  Private
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide both current and new password.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match.",
      });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, "Password updated successfully.");
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
