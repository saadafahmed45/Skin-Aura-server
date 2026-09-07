const Coupon = require("../models/Coupon");

// @desc    Apply coupon & calculate discount
// @route   POST /api/coupons/apply
// @access  Public
const applyCoupon = async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Please enter a promo code.",
      });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
      isActive: true,
      expiresAt: { $gte: new Date() },
    });

    if (!coupon) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired promo code.",
      });
    }

    const cartSubtotal = Number(subtotal) || 0;
    if (cartSubtotal < coupon.minSpend) {
      return res.status(400).json({
        success: false,
        message: `This coupon requires a minimum subtotal of $${coupon.minSpend}.`,
      });
    }

    let discount = (cartSubtotal * coupon.discountPercentage) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }

    discount = parseFloat(discount.toFixed(2));

    res.status(200).json({
      success: true,
      message: `Coupon applied: ${coupon.discountPercentage}% discount.`,
      discount,
      coupon: {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all coupons (admin)
// @route   GET /api/coupons
// @access  Private/Admin
const getCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon (admin)
// @route   POST /api/coupons
// @access  Private/Admin
const createCoupon = async (req, res, next) => {
  try {
    const { code, discountPercentage, minSpend, maxDiscount, expiresAt } =
      req.body;

    if (!code || !discountPercentage || !expiresAt) {
      return res.status(400).json({
        success: false,
        message: "Coupon code, discount percentage, and expiry date are required.",
      });
    }

    const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A coupon with this code already exists.",
      });
    }

    const coupon = await Coupon.create({
      code: code.trim().toUpperCase(),
      discountPercentage: Number(discountPercentage),
      minSpend: Number(minSpend) || 0,
      maxDiscount: Number(maxDiscount) || 1000,
      expiresAt: new Date(expiresAt),
      isActive: true,
    });

    res.status(201).json({
      success: true,
      message: "Coupon created successfully.",
      coupon,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete coupon (admin)
// @route   DELETE /api/coupons/:id
// @access  Private/Admin
const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await Coupon.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Coupon deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon,
};
