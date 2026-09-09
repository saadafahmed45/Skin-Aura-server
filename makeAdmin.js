/**
 * Utility script to promote any user to Admin in MongoDB
 * Usage:
 *   node makeAdmin.js user@example.com
 */

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const email = process.argv[2];

async function makeAdmin() {
  if (!email) {
    console.error("❌ Please provide an email address.");
    console.log("Usage: node makeAdmin.js your_email@example.com");
    process.exit(1);
  }

  try {
    const mongoUri =
      process.env.MONGODB_URI ||
      "mongodb+srv://skin_aura_database:KGFVyzq5QciYwj0j@cluster0.58zpnyp.mongodb.net/?appName=Cluster0";

    await mongoose.connect(mongoUri);
    console.log(" Connected to MongoDB.");

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      console.log("💡 Tip: Register this account first, then run this script again.");
      process.exit(1);
    }

    user.role = "admin";
    user.isActive = true;
    await user.save();

    console.log("==========================================");
    console.log(`✅ SUCCESS! ${user.name} (${user.email}) is now an Administrator!`);
    console.log(`Role: ${user.role}`);
    console.log("You can now access the Admin Dashboard at: http://localhost:3000/admin");
    console.log("==========================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating user role:", error.message);
    process.exit(1);
  }
}

makeAdmin();
