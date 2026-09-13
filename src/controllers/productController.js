const mongoose = require("mongoose");
const Product = require("../models/Product");
const getFallbackData = require("../utils/fallbackData");

// @desc    Get all products with search, filter, sort & pagination
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      brand,
      skinType,
      minPrice,
      maxPrice,
      rating,
      isFeatured,
      isTopSelling,
      search,
      sort,
      page = 1,
      limit = 20,
    } = req.query;

    // Graceful offline/startup fallback if MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      const { products } = getFallbackData();
      let list = [...products];

      if (category && category !== "all") {
        list = list.filter((p) => p.category?.toLowerCase() === category.toLowerCase());
      }
      if (brand) {
        list = list.filter((p) => p.brand?.toLowerCase().includes(brand.toLowerCase()));
      }
      if (skinType) {
        list = list.filter((p) =>
          Array.isArray(p.skinType)
            ? p.skinType.some((st) => st.toLowerCase().includes(skinType.toLowerCase()))
            : false
        );
      }
      if (minPrice !== undefined && minPrice !== "") {
        list = list.filter((p) => (p.price || 0) >= Number(minPrice));
      }
      if (maxPrice !== undefined && maxPrice !== "") {
        list = list.filter((p) => (p.price || 0) <= Number(maxPrice));
      }
      if (rating && Number(rating) > 0) {
        list = list.filter((p) => (p.rating || 0) >= Number(rating));
      }
      if (isFeatured !== undefined) {
        const feat = isFeatured === "true" || isFeatured === true;
        list = list.filter((p) => Boolean(p.isFeatured) === feat);
      }
      if (isTopSelling !== undefined) {
        const top = isTopSelling === "true" || isTopSelling === true;
        list = list.filter((p) => Boolean(p.isTopSelling) === top);
      }
      if (search && search.trim()) {
        const term = search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.name?.toLowerCase().includes(term) ||
            p.brand?.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term) ||
            p.description?.toLowerCase().includes(term)
        );
      }

      if (sort === "price-low") {
        list.sort((a, b) => (a.price || 0) - (b.price || 0));
      } else if (sort === "price-high") {
        list.sort((a, b) => (b.price || 0) - (a.price || 0));
      } else if (sort === "rating") {
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else if (sort === "top-selling" || sort === "sold") {
        list.sort((a, b) => {
          if (Boolean(b.isTopSelling) !== Boolean(a.isTopSelling)) {
            return b.isTopSelling ? 1 : -1;
          }
          return (b.sold || 0) - (a.sold || 0) || (b.rating || 0) - (a.rating || 0);
        });
      } else if (sort === "name-asc") {
        list.sort((a, b) => a.name.localeCompare(b.name));
      }

      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 20;
      const total = list.length;
      const paginated = list.slice((pageNum - 1) * limitNum, pageNum * limitNum);

      return res.status(200).json({
        success: true,
        count: paginated.length,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        currentPage: pageNum,
        products: paginated,
        data: paginated,
      });
    }

    const query = { isActive: true };

    // Category filter (allow "all" or omitted)
    if (category && category !== "all") {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    // Brand filter
    if (brand) {
      query.brand = { $regex: new RegExp(brand, "i") };
    }

    // Skin type filter (element in skinType array)
    if (skinType) {
      query.skinType = { $regex: new RegExp(skinType, "i") };
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined && minPrice !== "") {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && maxPrice !== "") {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Rating filter
    if (rating && Number(rating) > 0) {
      query.rating = { $gte: Number(rating) };
    }

    // Featured filter
    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === "true" || isFeatured === true;
    }

    // Top Selling filter
    if (isTopSelling !== undefined) {
      query.isTopSelling = isTopSelling === "true" || isTopSelling === true;
    }

    // Search query across name, brand, category, tags
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { category: searchRegex },
        { tags: searchRegex },
      ];
    }

    // Sorting
    let sortCriteria = { createdAt: -1 };
    if (sort === "price-low") {
      sortCriteria = { price: 1 };
    } else if (sort === "price-high") {
      sortCriteria = { price: -1 };
    } else if (sort === "rating") {
      sortCriteria = { rating: -1 };
    } else if (sort === "top-selling" || sort === "sold") {
      sortCriteria = { isTopSelling: -1, isFeatured: -1, sold: -1, rating: -1 };
    } else if (sort === "name-asc") {
      sortCriteria = { name: 1 };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [total, rawProducts] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .select("-imageDetails -__v")
        .sort(sortCriteria)
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const fallbackImageUrl =
      "https://images.pexels.com/photos/3762756/pexels-photo-3762756.jpeg";

    const products = rawProducts.map((p) => {
      const sanitizedImages = (p.images || []).map((img) =>
        typeof img === "string" && img.startsWith("data:") && img.length > 50000
          ? fallbackImageUrl
          : img
      );
      return {
        ...p,
        id: p.legacyId || p._id,
        images: sanitizedImages,
      };
    });

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limitNum) || 1,
      currentPage: pageNum,
      products,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by Mongo _id, numeric id, or slug
// @route   GET /api/products/:idOrSlug
// @access  Public
const getProductByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let product = null;

    if (mongoose.connection.readyState !== 1) {
      const { products } = getFallbackData();
      product =
        products.find(
          (p) =>
            String(p.id) === String(idOrSlug) ||
            String(p._id) === String(idOrSlug) ||
            p.slug?.toLowerCase() === idOrSlug.toLowerCase()
        ) || null;

      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product not found with identifier '${idOrSlug}'`,
        });
      }

      return res.status(200).json({
        success: true,
        product,
        data: product,
      });
    }

    // 1. Try finding by MongoDB ObjectId if valid
    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      product = await Product.findById(idOrSlug).lean();
    }

    // 2. Try finding by numeric legacyId (e.g. id: 1)
    if (!product && !isNaN(Number(idOrSlug))) {
      product = await Product.findOne({ legacyId: Number(idOrSlug) }).lean();
    }

    // 3. Try finding by slug
    if (!product) {
      product = await Product.findOne({ slug: idOrSlug.toLowerCase() }).lean();
    }

    if (product) {
      product.id = product.legacyId || product._id;
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product not found with identifier '${idOrSlug}'`,
      });
    }

    res.status(200).json({
      success: true,
      product,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product (admin)
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      const urls = req.files.map((file) => file.path);
      const details = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
      productData.images = urls;
      productData.imageDetails = details;
    }

    // Parse array fields if passed as JSON strings from FormData
    ["skinType", "ingredients", "tags"].forEach((field) => {
      if (typeof productData[field] === "string") {
        try {
          productData[field] = JSON.parse(productData[field]);
        } catch {
          productData[field] = productData[field]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
    });

    if (productData.price !== undefined) productData.price = Number(productData.price);
    if (productData.discountPrice !== undefined && productData.discountPrice !== "")
      productData.discountPrice = Number(productData.discountPrice);
    if (productData.discount !== undefined && productData.discount !== "")
      productData.discount = Number(productData.discount);
    if (productData.stock !== undefined) {
      productData.stock = Number(productData.stock);
      productData.inStock = productData.stock > 0;
    }

    // Auto generate unique slug if missing
    if (!productData.slug && productData.name) {
      const baseSlug = productData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "formula";
      productData.slug = `${baseSlug}-${Date.now().toString(36)}`;
    }

    // Auto generate sequential legacyId for backwards compatibility
    if (!productData.legacyId) {
      const highestLegacy = await Product.findOne().sort({ legacyId: -1 });
      productData.legacyId = (highestLegacy?.legacyId || 0) + 1;
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      product,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product (admin)
// @route   PATCH /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product = await Product.findById(id);

    if (!product && !isNaN(Number(id))) {
      product = await Product.findOne({ legacyId: Number(id) });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found to update.",
      });
    }

    const updates = { ...req.body };

    // Process uploaded files if any
    if (req.files && req.files.length > 0) {
      const urls = req.files.map((file) => file.path);
      const details = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
      updates.images = [...(product.images || []), ...urls];
      updates.imageDetails = [...(product.imageDetails || []), ...details];
    }

    // Parse array fields
    ["skinType", "ingredients", "tags"].forEach((field) => {
      if (typeof updates[field] === "string") {
        try {
          updates[field] = JSON.parse(updates[field]);
        } catch {
          updates[field] = updates[field]
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        }
      }
    });

    if (updates.price !== undefined) updates.price = Number(updates.price);
    if (updates.discountPrice !== undefined)
      updates.discountPrice = Number(updates.discountPrice);
    if (updates.discount !== undefined)
      updates.discount = Number(updates.discount);
    if (updates.stock !== undefined) {
      updates.stock = Number(updates.stock);
      updates.inStock = updates.stock > 0;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      product._id,
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      product: updatedProduct,
      data: updatedProduct,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete product (admin)
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    let product = await Product.findById(id);

    if (!product && !isNaN(Number(id))) {
      product = await Product.findOne({ legacyId: Number(id) });
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found to delete.",
      });
    }

    await Product.findByIdAndDelete(product._id);

    res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  getProductByIdOrSlug,
  createProduct,
  updateProduct,
  deleteProduct,
};
