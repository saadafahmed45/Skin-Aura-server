const cloudinary = require("cloudinary").v2;

// Auto-sanitize cloud_name: handle whitespace, accidental "demo" prefix (e.g. "demodvahyslg6" -> "dvahyslg6")
const sanitizeCloudName = (rawName) => {
  if (!rawName) return "";
  let cleaned = String(rawName).trim().replace(/^["']|["']$/g, "");
  if (cleaned.startsWith("demo") && cleaned.length > 4) {
    cleaned = cleaned.replace(/^demo/, "");
  }
  return cleaned;
};

const sanitizeCred = (val) => {
  if (!val) return "";
  return String(val).trim().replace(/^["']|["']$/g, "");
};

cloudinary.config({
  cloud_name: sanitizeCloudName(process.env.CLOUDINARY_CLOUD_NAME),
  api_key: sanitizeCred(process.env.CLOUDINARY_API_KEY),
  api_secret: sanitizeCred(process.env.CLOUDINARY_API_SECRET),
});

module.exports = cloudinary;
