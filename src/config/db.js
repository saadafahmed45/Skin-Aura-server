const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[MongoDB] Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error] ${error.message}`);
    console.error(
      `Please ensure MongoDB is running locally or set MONGODB_URI to your MongoDB Atlas connection string in server/.env`
    );
  }
};

module.exports = connectDB;
