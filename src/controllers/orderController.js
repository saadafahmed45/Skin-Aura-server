const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Coupon = require("../models/Coupon");
const Cart = require("../models/Cart");

// @desc    Create new order with server-verified prices & stock
// @route   POST /api/orders
// @access  Public or Private (supports guest and logged in)
const createOrder = async (req, res, next) => {
  try {
    const { customer, items, couponCode } = req.body;

    if (!customer || !customer.name || !customer.phone || !customer.address) {
      return res.status(400).json({
        success: false,
        message: "Customer name, phone number, and shipping address are required.",
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Please add items before checking out.",
      });
    }

    // 1. Retrieve products from MongoDB & verify stock and prices
    const orderItems = [];
    let calculatedSubtotal = 0;

    for (const item of items) {
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1);
      let product = null;

      // Match by MongoDB ObjectId, legacyId, or item.id
      if (item._id && mongoose.Types.ObjectId.isValid(item._id)) {
        product = await Product.findById(item._id);
      } else if (item.id && mongoose.Types.ObjectId.isValid(item.id)) {
        product = await Product.findById(item.id);
      } else if (item.id && !isNaN(Number(item.id))) {
        product = await Product.findOne({ legacyId: Number(item.id) });
      }

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product '${item.name || item.id}' is no longer available.`,
        });
      }

      if (product.stock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.stock}, requested: ${quantity}.`,
        });
      }

      // Authoritative pricing from DB
      const itemPrice =
        product.discount > 0 && product.discountPrice > 0
          ? product.discountPrice
          : product.price;

      const itemTotal = parseFloat((itemPrice * quantity).toFixed(2));
      calculatedSubtotal += itemTotal;

      orderItems.push({
        product: product._id,
        legacyProductId: product.legacyId,
        name: product.name,
        images: product.images,
        price: itemPrice,
        quantity,
        totalPrice: itemTotal,
      });
    }

    calculatedSubtotal = parseFloat(calculatedSubtotal.toFixed(2));

    // 2. Coupon discount verification
    let discountAmount = 0;
    if (couponCode && couponCode.trim()) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
        expiresAt: { $gte: new Date() },
      });

      if (coupon && calculatedSubtotal >= coupon.minSpend) {
        discountAmount = parseFloat(
          ((calculatedSubtotal * coupon.discountPercentage) / 100).toFixed(2)
        );
        if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
          discountAmount = coupon.maxDiscount;
        }
      }
    }

    // 3. Delivery fee ($5 standard)
    const deliveryFee = orderItems.length > 0 ? 5 : 0;
    const calculatedTotal = parseFloat(
      Math.max(0, calculatedSubtotal - discountAmount + deliveryFee).toFixed(2)
    );

    // 4. Create Order
    const order = await Order.create({
      user: req.user ? req.user._id : undefined,
      customer: {
        name: customer.name.trim(),
        phone: customer.phone.trim(),
        email: customer.email || (req.user ? req.user.email : ""),
        address: customer.address.trim(),
        paymentMethod: customer.paymentMethod || "cod",
      },
      items: orderItems,
      subtotal: calculatedSubtotal,
      deliveryFee,
      discount: discountAmount,
      total: calculatedTotal,
      couponCode: couponCode || "",
      orderStatus: "pending",
      paymentStatus: customer.paymentMethod === "advance" ? "paid" : "pending",
    });

    // 5. Decrement stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      });
    }

    // 6. Clear user cart if authenticated
    if (req.user) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    }

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders for current user or guest (by phone/email)
// @route   GET /api/orders
// @access  Public / Private
const getMyOrders = async (req, res, next) => {
  try {
    let query = {};

    if (req.user) {
      query.$or = [{ user: req.user._id }, { "customer.email": req.user.email }];
    } else if (req.query.phone) {
      query["customer.phone"] = req.query.phone;
    } else {
      // If unauthenticated and no phone, return empty list
      return res.status(200).json({
        success: true,
        orders: [],
        data: [],
      });
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order details by orderNumber or _id
// @route   GET /api/orders/:id
// @access  Public / Private
const getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let order = null;

    if (mongoose.Types.ObjectId.isValid(id)) {
      order = await Order.findById(id);
    }

    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // If authenticated customer, ensure order belongs to them
    if (
      req.user &&
      req.user.role !== "admin" &&
      order.user &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this order.",
      });
    }

    res.status(200).json({
      success: true,
      order,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order (if pending or confirmed)
// @route   PATCH /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    let order = await Order.findById(id);

    if (!order) {
      order = await Order.findOne({ orderNumber: id });
    }

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (
      req.user &&
      req.user.role !== "admin" &&
      order.user &&
      order.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to modify this order.",
      });
    }

    if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.orderStatus}.`,
      });
    }

    order.orderStatus = "cancelled";
    await order.save();

    // Restock items
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }

    res.status(200).json({
      success: true,
      message: "Order has been cancelled successfully.",
      order,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
