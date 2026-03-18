import amqplib from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672";
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 3000;

let connection = null;
let channel = null;

/**
 * Connect to RabbitMQ with retry logic.
 * RabbitMQ often takes a while to become ready in Docker,
 * so we retry up to MAX_RETRIES times before giving up.
 */
export async function connectRabbitMQ() {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[RabbitMQ] Connection attempt ${attempt}/${MAX_RETRIES}...`);
      connection = await amqplib.connect(RABBITMQ_URL);
      channel = await connection.createChannel();

      // Declare all the queues we need
      await channel.assertQueue("notifications.email", { durable: true });
      await channel.assertQueue("notifications.push", { durable: true });
      await channel.assertQueue("notifications.websocket", { durable: true });

      console.log("[RabbitMQ] Connected and queues declared");

      connection.on("error", (err) => {
        console.error("[RabbitMQ] Connection error:", err.message);
      });
      connection.on("close", () => {
        console.warn("[RabbitMQ] Connection closed, will attempt reconnect...");
        channel = null;
        connection = null;
        setTimeout(connectRabbitMQ, RETRY_DELAY_MS);
      });

      return channel;
    } catch (err) {
      console.error(`[RabbitMQ] Attempt ${attempt} failed: ${err.message}`);
      if (attempt === MAX_RETRIES) {
        throw new Error(`Failed to connect to RabbitMQ after ${MAX_RETRIES} attempts`);
      }
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
}

export function getChannel() {
  if (!channel) {
    throw new Error("RabbitMQ channel not initialized — call connectRabbitMQ() first");
  }
  return channel;
}

export async function closeRabbitMQ() {
  try {
    if (channel) await channel.close();
    if (connection) await connection.close();
  } catch {
    // swallow — shutting down anyway
  }
}
