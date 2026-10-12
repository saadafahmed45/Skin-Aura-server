const cloudinary = require("../config/cloudinary");

// @desc    Upload images to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
const uploadImages = async (req, res) => {
  try {
    const uploaded = [];

    // 1. Files uploaded via Multer multipart
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        uploaded.push({
          url: file.path,
          public_id: file.filename,
        });
      });
    }

    // 2. Base64 data URLs or existing image URLs in JSON body
    if (uploaded.length === 0 && (req.body?.images || req.body?.image)) {
      const rawList = Array.isArray(req.body.images)
        ? req.body.images
        : [req.body.image || req.body.images].filter(Boolean);

      for (const item of rawList) {
        if (typeof item === "string" && item.startsWith("data:image")) {
          const uploadRes = await cloudinary.uploader.upload(item, {
            folder: "skinaura/products",
            transformation: [{ width: 1200, height: 1200, crop: "limit", quality: "auto" }],
          });
          uploaded.push({
            url: uploadRes.secure_url,
            public_id: uploadRes.public_id,
          });
        } else if (typeof item === "string" && item.startsWith("http")) {
          uploaded.push({
            url: item,
            public_id: "",
          });
        }
      }
    }

    if (uploaded.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image file or provide valid image data.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Images uploaded successfully.",
      images: uploaded.map((img) => img.url),
      imageDetails: uploaded,
      data: uploaded,
    });
  } catch (error) {
    console.error("[Upload Controller Error]:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload images.",
    });
  }
};

module.exports = {
  uploadImages,
};

