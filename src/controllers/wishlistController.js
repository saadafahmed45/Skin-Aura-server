const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  Private
const getWishlist = async (req, res, next) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate(
      "products"
    );

    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    res.status(200).json({
      success: true,
      count: wishlist.products.length,
      wishlist: wishlist.products,
      data: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to wishlist
// @route   POST /api/wishlist/:productId
// @access  Private
const addToWishlist = async (req, res, next) => {
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

    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    }

    if (!wishlist.products.includes(product._id)) {
      wishlist.products.push(product._id);
      await wishlist.save();
    }

    await wishlist.populate("products");

    res.status(200).json({
      success: true,
      message: "Product added to wishlist.",
      wishlist: wishlist.products,
      data: wishlist.products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove product from wishlist
// @route   DELETE /api/wishlist/:productId
// @access  Private
const removeFromWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;

    let product = await Product.findById(productId);
    if (!product && !isNaN(Number(productId))) {
      product = await Product.findOne({ legacyId: Number(productId) });
    }

    const targetId = product ? product._id : productId;

    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = wishlist.products.filter(
        (p) => p.toString() !== targetId.toString()
      );
      await wishlist.save();
      await wishlist.populate("products");
    }

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist.",
      wishlist: wishlist ? wishlist.products : [],
      data: wishlist ? wishlist.products : [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
