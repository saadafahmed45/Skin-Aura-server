const mongoose = require("mongoose");

const connectDB = async () => {
  // If already connected, reuse connection in serverless
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    console.error(
      `Please ensure MongoDB is running locally or set MONGODB_URI to your MongoDB Atlas connection string in server/.env or Vercel Environment Variables`
    );
  }
};

module.exports = connectDB;
