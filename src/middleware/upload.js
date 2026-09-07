const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// Cloudinary storage configuration
const createCloudinaryStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: `skinaura/${folderName}`,
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
    },
  });
};

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpg, jpeg, png, webp) are permitted"), false);
  }
};

const uploadProductImages = multer({
  storage: createCloudinaryStorage("products"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

const uploadCategoryImages = multer({
  storage: createCloudinaryStorage("categories"),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const uploadUserAvatar = multer({
  storage: createCloudinaryStorage("users"),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter,
});

module.exports = {
  uploadProductImages,
  uploadCategoryImages,
  uploadUserAvatar,
};
