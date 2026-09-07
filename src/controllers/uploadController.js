// @desc    Upload images to Cloudinary
// @route   POST /api/upload
// @access  Private/Admin
const uploadImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one image file.",
      });
    }

    const uploaded = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully.",
      images: uploaded.map((img) => img.url),
      imageDetails: uploaded,
      data: uploaded,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload images.",
    });
  }
};

module.exports = {
  uploadImages,
};
