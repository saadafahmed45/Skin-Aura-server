const jwt = require("jsonwebtoken");

const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: "7d",
  });
};

const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateAccessToken(user._id);

  const isProduction = process.env.NODE_ENV === "production";

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    domain:
      isProduction &&
      process.env.COOKIE_DOMAIN &&
      process.env.COOKIE_DOMAIN !== "localhost"
        ? process.env.COOKIE_DOMAIN
        : undefined,
  };

  res
    .status(statusCode)
    .cookie("skinaura_token", token, cookieOptions)
    .json({
      success: true,
      message,
      token, // Also provided in body for flexible clients
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
      },
    });
};

module.exports = {
  generateAccessToken,
  sendTokenResponse,
};
