
require("dotenv").config();

const mongoose = require("mongoose");
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 4000;

let server;

connectDB()
  .then(() => {
    server = app.listen(PORT, () => {
      console.log(`DeskShare API running on http://localhost:${PORT}`);
      console.log(`Swagger docs: http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  });

// Graceful shutdown: stop accepting connections, close the DB, then exit.
async function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);

  const closeServer = server
    ? new Promise((resolve) => server.close(resolve))
    : Promise.resolve();

  try {
    await closeServer;
    await mongoose.connection.close();
    console.log("Shutdown complete.");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error.message);
    process.exit(1);
  }
}

["SIGINT", "SIGTERM"].forEach((signal) => {
  process.on(signal, () => shutdown(signal));
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutdown("uncaughtException");
});
