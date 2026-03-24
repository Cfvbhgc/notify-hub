import { WebSocketServer } from "ws";

// Map userId -> Set of WebSocket connections
// A user can have multiple open tabs/devices
const clients = new Map();

let wss = null;

/**
 * Initialize WebSocket server on top of the existing HTTP server.
 * Clients connect with ?userId=xxx query param.
 */
export function initWebSocket(server) {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      ws.close(4001, "Missing userId query parameter");
      return;
    }

    // Register this connection
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId).add(ws);
    console.log(`[WS] Client connected: userId=${userId} (${clients.get(userId).size} connections)`);

    ws.on("close", () => {
      const userSockets = clients.get(userId);
      if (userSockets) {
        userSockets.delete(ws);
        if (userSockets.size === 0) clients.delete(userId);
      }
      console.log(`[WS] Client disconnected: userId=${userId}`);
    });

    ws.on("error", (err) => {
      console.error(`[WS] Error for userId=${userId}:`, err.message);
    });

    // Send a welcome message so the client knows the connection works
    ws.send(JSON.stringify({ type: "connected", userId }));
  });

  console.log("[WS] WebSocket server ready on /ws");
}

/**
 * Send a notification to a specific user over WebSocket.
 * Returns true if at least one connection received it.
 */
export function sendToUser(userId, notification) {
  const userSockets = clients.get(userId);
  if (!userSockets || userSockets.size === 0) {
    console.log(`[WS] No active connections for userId=${userId}, notification not delivered in real-time`);
    return false;
  }

  const payload = JSON.stringify({
    type: "notification",
    data: notification,
  });

  let delivered = 0;
  for (const ws of userSockets) {
    if (ws.readyState === ws.OPEN) {
      ws.send(payload);
      delivered++;
    }
  }

  console.log(`[WS] Delivered to ${delivered} connection(s) for userId=${userId}`);
  return delivered > 0;
}

export function getConnectedUserCount() {
  return clients.size;
}
