const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");

// @desc    Get approved reviews for a specific product
// @route   GET /api/reviews/product/:productId
// @access  Public
const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let product = await Product.findById(productId);
    if (!product && !isNaN(Number(productId))) {
      product = await Product.findOne({ legacyId: Number(productId) });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    const reviews = await Review.find({
      product: product._id,
      isApproved: true,
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create review for a product
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  try {
    const { productId, rating, comment, images } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Product ID, rating, and review comment are required.",
      });
    }

    let product = await Product.findById(productId);
    if (!product && !isNaN(Number(productId))) {
      product = await Product.findOne({ legacyId: Number(productId) });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found to review.",
      });
    }

    // Check if user already reviewed
    const existingReview = await Review.findOne({
      user: req.user._id,
      product: product._id,
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already submitted a review for this product.",
      });
    }

    // Check verified purchase in delivered orders
    const verifiedOrder = await Order.findOne({
      $or: [{ user: req.user._id }, { "customer.email": req.user.email }],
      "items.product": product._id,
      orderStatus: { $in: ["delivered", "shipped", "confirmed"] },
    });

    const isVerifiedPurchase = Boolean(verifiedOrder);

    const review = await Review.create({
      user: req.user._id,
      userName: req.user.name,
      userAvatar: req.user.avatar?.url || "",
      product: product._id,
      rating: Number(rating),
      comment: comment.trim(),
      images: Array.isArray(images) ? images : [],
      isVerifiedPurchase,
      isApproved: true, // auto approve
    });

    res.status(201).json({
      success: true,
      message: "Thank you for sharing your experience! Review posted.",
      review,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews (admin)
// @route   GET /api/reviews
// @access  Private/Admin
const getAllReviews = async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate("product", "name images category")
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/Reject review (admin)
// @route   PATCH /api/reviews/:id/approve
// @access  Private/Admin
const toggleApproveReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    review.isApproved = !review.isApproved;
    await review.save();

    // Recalculate average rating
    await Review.calcAverageRating(review.product);

    res.status(200).json({
      success: true,
      message: `Review has been ${review.isApproved ? "approved" : "hidden"}.`,
      review,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review (admin)
// @route   DELETE /api/reviews/:id
// @access  Private/Admin
const deleteReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found.",
      });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id);

    // Recalculate
    await Review.calcAverageRating(productId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProductReviews,
  createReview,
  getAllReviews,
  toggleApproveReview,
  deleteReview,
};
