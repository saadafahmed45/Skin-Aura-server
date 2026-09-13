const mongoose = require("mongoose");
const Category = require("../models/Category");
const getFallbackData = require("../utils/fallbackData");

// @desc    Get all categories
// @route   GET /api/categories
// @access  Public
const getCategories = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const { categories } = getFallbackData();
      return res.status(200).json({
        success: true,
        count: categories.length,
        categories,
        data: categories,
      });
    }

    const categories = await Category.find({ isActive: true })
      .select("-__v")
      .sort({ createdAt: 1 })
      .lean();
    res.status(200).json({
      success: true,
      count: categories.length,
      categories,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category by ID, slug, or name
// @route   GET /api/categories/:idOrSlug
// @access  Public
const getCategoryByIdOrSlug = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    let category = null;

    if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
      category = await Category.findById(idOrSlug);
    }

    if (!category && !isNaN(Number(idOrSlug))) {
      category = await Category.findOne({ legacyId: Number(idOrSlug) });
    }

    if (!category) {
      category = await Category.findOne({
        $or: [
          { slug: idOrSlug.toLowerCase() },
          { name: { $regex: new RegExp(`^${idOrSlug}$`, "i") } },
        ],
      });
    }

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${idOrSlug}' not found.`,
      });
    }

    res.status(200).json({
      success: true,
      category,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category (admin)
// @route   POST /api/categories
// @access  Private/Admin
const createCategory = async (req, res, next) => {
  try {
    const { name, slug, description } = req.body;

    let image = req.body.image;
    let imagePublicId = "";

    if (req.file) {
      image = req.file.path;
      imagePublicId = req.file.filename;
    }

    if (!name || !image) {
      return res.status(400).json({
        success: false,
        message: "Category name and image are required.",
      });
    }

    const category = await Category.create({
      name,
      slug: slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: description || "",
      image,
      imagePublicId,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      category,
      data: category,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category (admin)
// @route   PATCH /api/categories/:id
// @access  Private/Admin
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    let category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found to update.",
      });
    }

    const updates = { ...req.body };

    if (req.file) {
      updates.image = req.file.path;
      updates.imagePublicId = req.file.filename;
    }

    const updated = await Category.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
      category: updated,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category (admin)
// @route   DELETE /api/categories/:id
// @access  Private/Admin
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found to delete.",
      });
    }

    await Category.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryByIdOrSlug,
  createCategory,
  updateCategory,
  deleteCategory,
};
