import { getChannel } from "../config/rabbitmq.js";

const QUEUE_MAP = {
  email: "notifications.email",
  push: "notifications.push",
  websocket: "notifications.websocket",
};

/**
 * Publish a notification to the appropriate RabbitMQ queue based on channel.
 * Messages are persisted (deliveryMode 2) so they survive broker restarts.
 */
export async function publishNotification(notification) {
  const channel = getChannel();
  const queueName = QUEUE_MAP[notification.channel];

  if (!queueName) {
    throw new Error(`Unknown notification channel: ${notification.channel}`);
  }

  const payload = Buffer.from(JSON.stringify(notification));
  channel.sendToQueue(queueName, payload, { persistent: true });

  console.log(`[Queue] Published to ${queueName}: ${notification.id}`);
}

/**
 * Start consuming from a specific queue.
 * The handler receives parsed notification objects.
 */
export async function consumeQueue(queueName, handler) {
  const channel = getChannel();

  // process one message at a time per consumer
  await channel.prefetch(1);

  channel.consume(queueName, async (msg) => {
    if (!msg) return;

    try {
      const notification = JSON.parse(msg.content.toString());
      await handler(notification);
      channel.ack(msg);
    } catch (err) {
      console.error(`[Queue] Error processing message from ${queueName}:`, err.message);
      // nack and don't requeue — send to dead letter if configured, otherwise discard
      channel.nack(msg, false, false);
    }
  });

  console.log(`[Queue] Consuming from ${queueName}`);
}
