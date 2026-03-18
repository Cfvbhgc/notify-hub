import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";

import { connectRabbitMQ, closeRabbitMQ } from "./config/rabbitmq.js";
import { initWebSocket } from "./services/websocketService.js";
import { startWorkers } from "./workers/notificationWorker.js";
import notificationRoutes from "./routes/notifications.js";
import templateRoutes from "./routes/templates.js";
import { errorHandler } from "./middleware/errorHandler.js";

const PORT = process.env.PORT || 3002;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Routes
app.use("/api/notifications", notificationRoutes);
app.use("/api/templates", templateRoutes);

// Error handler (must be last)
app.use(errorHandler);

// Create HTTP server so we can share it with WebSocket
const server = createServer(app);

async function start() {
  try {
    // Connect to RabbitMQ (retries built in)
    await connectRabbitMQ();

    // Start queue consumers
    await startWorkers();

    // Attach WebSocket server
    initWebSocket(server);

    server.listen(PORT, () => {
      console.log(`[Server] NotifyHub running on http://localhost:${PORT}`);
      console.log(`[Server] WebSocket available at ws://localhost:${PORT}/ws?userId=<id>`);
    });
  } catch (err) {
    console.error("[Server] Failed to start:", err.message);
    process.exit(1);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log("\n[Server] Shutting down...");
  server.close();
  await closeRabbitMQ();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

start();
