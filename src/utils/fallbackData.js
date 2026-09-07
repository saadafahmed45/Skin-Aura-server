const fs = require("fs");
const path = require("path");

let cachedProducts = null;
let cachedCategories = null;

const getFallbackData = () => {
  if (cachedProducts && cachedCategories) {
    return { products: cachedProducts, categories: cachedCategories };
  }

  try {
    const skinDataPath = path.resolve(
      __dirname,
      "../../../client/app/api/skinData.js"
    );
    const catDataPath = path.resolve(
      __dirname,
      "../../../client/app/api/categories.js"
    );

    if (fs.existsSync(skinDataPath)) {
      const content = fs.readFileSync(skinDataPath, "utf8");
      // Extract array
      const match = content.match(/export const skincareProducts = (\[[\s\S]*?\]);/);
      if (match && match[1]) {
        // Evaluate in clean context
        cachedProducts = Function(`"use strict"; return (${match[1]});`)();
      }
    }

    if (fs.existsSync(catDataPath)) {
      const content = fs.readFileSync(catDataPath, "utf8");
      const match = content.match(/export const categories = (\[[\s\S]*?\]);/);
      if (match && match[1]) {
        cachedCategories = Function(`"use strict"; return (${match[1]});`)();
      }
    }
  } catch (err) {
    console.error("Could not load fallback client data:", err.message);
  }

  return {
    products: cachedProducts || [],
    categories: cachedCategories || [],
  };
};

module.exports = getFallbackData;
