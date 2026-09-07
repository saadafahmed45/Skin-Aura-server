require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5000;

// Start server when run directly (local development or container)
if (!process.env.VERCEL) {
  const startServer = async () => {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`✨ [SkinAura API] Server running on http://localhost:${PORT}`);
      console.log(`✨ [SkinAura API] Health Check: http://localhost:${PORT}/api/health`);
    });
  };

  startServer();
}

module.exports = app;

