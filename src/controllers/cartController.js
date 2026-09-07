const Cart = require("../models/Cart");
const Product = require("../models/Product");

// @desc    Get current user's cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product");

    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    // Format cart response with authoritative prices
    const formattedItems = cart.items
      .filter((i) => i.product && i.product.isActive)
      .map((i) => {
        const p = i.product;
        const price = p.discount > 0 && p.discountPrice > 0 ? p.discountPrice : p.price;
        return {
          id: p.legacyId || p._id,
          _id: p._id,
          name: p.name,
          images: p.images,
          brand: p.brand,
          price,
          originalPrice: p.price,
          discount: p.discount,
          quantity: i.quantity,
          totalPrice: parseFloat((price * i.quantity).toFixed(2)),
          inStock: p.stock > 0,
          stock: p.stock,
        };
      });

    const subtotal = formattedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);
    const deliveryFee = formattedItems.length > 0 ? 5 : 0;
    const total = parseFloat((subtotal + deliveryFee).toFixed(2));

    res.status(200).json({
      success: true,
      items: formattedItems,
      subtotal: parseFloat(subtotal.toFixed(2)),
      deliveryFee,
      total,
      data: {
        items: formattedItems,
        subtotal: parseFloat(subtotal.toFixed(2)),
        deliveryFee,
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add product to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;

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

    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available in stock.`,
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    const itemIndex = cart.items.findIndex(
      (i) => i.product.toString() === product._id.toString()
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        product: product._id,
        quantity: Number(quantity),
      });
    }

    await cart.save();
    return getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PATCH /api/cart/:productId
// @access  Private
const updateCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    const item = cart.items.find(
      (i) => i.product.toString() === productId || i._id.toString() === productId
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart.",
      });
    }

    if (Number(quantity) <= 0) {
      cart.items = cart.items.filter(
        (i) => i.product.toString() !== productId && i._id.toString() !== productId
      );
    } else {
      item.quantity = Number(quantity);
    }

    await cart.save();
    return getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:productId
// @access  Private
const removeCartItem = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const cart = await Cart.findOne({ user: req.user._id });

    if (cart) {
      cart.items = cart.items.filter(
        (i) => i.product.toString() !== productId && i._id.toString() !== productId
      );
      await cart.save();
    }

    return getCart(req, res, next);
  } catch (error) {
    next(error);
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart
// @access  Private
const clearCart = async (req, res, next) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
      items: [],
      subtotal: 0,
      deliveryFee: 0,
      total: 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
