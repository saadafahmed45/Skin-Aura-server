const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userAvatar: {
      type: String,
      default: "",
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
    },
    images: {
      type: [String],
      default: [],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    isApproved: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Prevent duplicate review per user per product
reviewSchema.index({ user: 1, product: 1 }, { unique: true });

// Static method to recalculate product average rating & review count
reviewSchema.statics.calcAverageRating = async function (productId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId, isApproved: true },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  const Product = mongoose.model("Product");
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: parseFloat(stats[0].avgRating.toFixed(1)),
      reviewCount: stats[0].nRating,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 5.0,
      reviewCount: 0,
    });
  }
};

reviewSchema.post("save", function () {
  this.constructor.calcAverageRating(this.product);
});

reviewSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRating(doc.product);
  }
});

module.exports = mongoose.model("Review", reviewSchema);
