require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");

const User = require("./src/models/User");
const Category = require("./src/models/Category");
const Product = require("./src/models/Product");
const Coupon = require("./src/models/Coupon");
const Review = require("./src/models/Review");
const Order = require("./src/models/Order");

const loadClientData = () => {
  // Read categories from client/app/api/categories.js
  const catFile = path.resolve(__dirname, "../client/app/api/categories.js");
  const catContent = fs.readFileSync(catFile, "utf8");
  const tempCatFile = path.resolve(__dirname, "./temp_cats.cjs");
  fs.writeFileSync(
    tempCatFile,
    catContent.replace("export const categories =", "module.exports =")
  );
  const categories = require(tempCatFile);
  fs.unlinkSync(tempCatFile);

  // Read products from client/app/api/skinData.js
  const prodFile = path.resolve(__dirname, "../client/app/api/skinData.js");
  const prodContent = fs.readFileSync(prodFile, "utf8");
  const tempProdFile = path.resolve(__dirname, "./temp_prods.cjs");
  fs.writeFileSync(
    tempProdFile,
    prodContent.replace("export const skincareProducts =", "module.exports =")
  );
  const products = require(tempProdFile);
  fs.unlinkSync(tempProdFile);

  return { categories, products };
};

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting SkinAura database seed...");
    await connectDB();

    // 1. Clean existing collections
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await Review.deleteMany({});
    await Order.deleteMany({});

    console.log("🧹 Cleaned old database records.");

    // 2. Seed Admin & Demo Customer
    const admin = await User.create({
      name: "SkinAura Admin",
      email: "admin@skinaura.com",
      password: "AdminPassword123!",
      role: "admin",
      phone: "+1 (555) 888-9999",
      address: "SkinAura Headquarters, New York, NY",
    });

    const customer = await User.create({
      name: "Emma Watson",
      email: "customer@skinaura.com",
      password: "CustomerPassword123!",
      role: "customer",
      phone: "+1 (555) 123-4567",
      address: "742 Evergreen Terrace, Springfield, OR",
    });

    console.log("👤 Created Admin and Customer accounts:");
    console.log("   Admin:    admin@skinaura.com / AdminPassword123!");
    console.log("   Customer: customer@skinaura.com / CustomerPassword123!");

    // 3. Load and Seed Categories
    const { categories, products } = loadClientData();

    const categoryDocs = categories.map((cat) => ({
      legacyId: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      image: cat.image,
      isActive: true,
    }));

    await Category.insertMany(categoryDocs);
    console.log(`📁 Seeded ${categoryDocs.length} categories.`);

    // 4. Seed Products
    const productDocs = products.map((p) => ({
      legacyId: p.id,
      name: p.name,
      category: p.category,
      subcategory: p.subcategory || "",
      brand: p.brand,
      price: p.price,
      discountPrice: p.discountPrice || p.price,
      discount: p.discount || 0,
      stock: p.stock ?? 50,
      inStock: (p.stock ?? 50) > 0,
      sold: p.sold || 0,
      size: p.size || "standard",
      skinType: Array.isArray(p.skinType) ? p.skinType : [],
      ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
      rating: p.rating || 5.0,
      reviewCount: p.reviewCount || 0,
      isFeatured: Boolean(p.isFeatured),
      tags: Array.isArray(p.tags) ? p.tags : [],
      slug:
        p.slug ||
        p.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      description: p.description || "",
      images: Array.isArray(p.images) ? p.images : [],
      imageDetails: Array.isArray(p.images)
        ? p.images.map((url) => ({ url, public_id: "" }))
        : [],
      isActive: true,
    }));

    const createdProducts = await Product.insertMany(productDocs);
    console.log(`🧴 Seeded ${createdProducts.length} skincare products.`);

    // 5. Seed Coupons
    await Coupon.create([
      {
        code: "GLOW20",
        discountPercentage: 20,
        minSpend: 25,
        maxDiscount: 100,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
      {
        code: "SKINAURA10",
        discountPercentage: 10,
        minSpend: 0,
        maxDiscount: 50,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isActive: true,
      },
    ]);
    console.log("🏷️  Seeded coupons: GLOW20 (20% off), SKINAURA10 (10% off).");

    // 6. Seed Sample Reviews
    if (createdProducts.length > 0) {
      await Review.create([
        {
          user: customer._id,
          userName: customer.name,
          product: createdProducts[0]._id,
          rating: 5,
          comment:
            "This cleanser has completely transformed my daily morning ritual! My skin feels hydrated, calm, and never tight.",
          isVerifiedPurchase: true,
          isApproved: true,
        },
        {
          user: customer._id,
          userName: customer.name,
          product: createdProducts[1]._id,
          rating: 5,
          comment:
            "Unbelievable results within just two weeks. Breakouts are completely under control and my skin looks radiant.",
          isVerifiedPurchase: true,
          isApproved: true,
        },
      ]);
      console.log("⭐ Seeded sample verified reviews.");
    }

    console.log("✅ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  }
};

seedDatabase();
