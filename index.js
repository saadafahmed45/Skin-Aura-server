require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect to Database
  await connectDB();

  app.listen(PORT, () => {
    console.log(`✨ [SkinAura API] Server running on http://localhost:${PORT}`);
    console.log(`✨ [SkinAura API] Health Check: http://localhost:${PORT}/api/health`);
  });
};

startServer();
