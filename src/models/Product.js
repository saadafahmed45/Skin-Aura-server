const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    legacyId: {
      type: Number,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    shortDescription: {
      type: String,
      default: "",
    },
    brand: {
      type: String,
      required: [true, "Brand is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      index: true,
    },
    subcategory: {
      type: String,
      default: "",
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: [true, "Stock quantity is required"],
      default: 0,
      min: 0,
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    sold: {
      type: Number,
      default: 0,
    },
    size: {
      type: String,
      default: "standard",
    },
    skinType: {
      type: [String],
      default: [],
    },
    ingredients: {
      type: [String],
      default: [],
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isTopSelling: {
      type: Boolean,
      default: false,
      index: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    // Array of image URLs for direct frontend compatibility
    images: {
      type: [String],
      default: [],
    },
    // Detailed Cloudinary storage info (url + public_id)
    imageDetails: [
      {
        url: { type: String, required: true },
        public_id: { type: String, default: "" },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        ret.id = doc.legacyId || ret._id;
        return ret;
      },
    },
  }
);

// Auto compute inStock and unique slug before validation
productSchema.pre("validate", function () {
  if (this.stock !== undefined) {
    this.inStock = Number(this.stock) > 0;
  }
  if (!this.slug && this.name) {
    const base = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "formula";
    this.slug = `${base}-${Date.now().toString(36)}`;
  }
});

module.exports = mongoose.model("Product", productSchema);
