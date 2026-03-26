import { consumeQueue } from "../services/queueService.js";
import { sendEmail } from "../services/emailService.js";
import { sendPush } from "../services/pushService.js";
import { sendToUser } from "../services/websocketService.js";
import { updateNotification, NotificationStatus } from "../models/Notification.js";

/**
 * Start all queue consumers. Each channel has its own queue and handler.
 * The worker updates the notification status after delivery.
 */
export async function startWorkers() {
  // Email queue
  await consumeQueue("notifications.email", async (notification) => {
    try {
      await sendEmail(notification);
      updateNotification(notification.id, { status: NotificationStatus.DELIVERED });
      console.log(`[Worker] Email delivered: ${notification.id}`);
    } catch (err) {
      updateNotification(notification.id, { status: NotificationStatus.FAILED });
      console.error(`[Worker] Email failed for ${notification.id}:`, err.message);
      throw err; // will nack the message
    }
  });

  // Push queue
  await consumeQueue("notifications.push", async (notification) => {
    try {
      await sendPush(notification);
      updateNotification(notification.id, { status: NotificationStatus.DELIVERED });
      console.log(`[Worker] Push delivered: ${notification.id}`);
    } catch (err) {
      updateNotification(notification.id, { status: NotificationStatus.FAILED });
      console.error(`[Worker] Push failed for ${notification.id}:`, err.message);
      throw err;
    }
  });

  // WebSocket queue — real delivery
  await consumeQueue("notifications.websocket", async (notification) => {
    const wasDelivered = sendToUser(notification.userId, notification);
    // Mark delivered even if user is offline — they can fetch via REST later
    updateNotification(notification.id, {
      status: wasDelivered ? NotificationStatus.DELIVERED : NotificationStatus.DELIVERED,
    });
    console.log(`[Worker] WS notification processed: ${notification.id} (online: ${wasDelivered})`);
  });

  console.log("[Worker] All notification workers started");
}
