import { Router } from "express";
import { asyncWrap } from "../middleware/errorHandler.js";
import {
  createNotification,
  getNotificationById,
  listNotifications,
  updateNotification,
  NotificationStatus,
  Channel,
} from "../models/Notification.js";
import { getTemplateById, renderTemplate } from "../models/Template.js";
import { publishNotification } from "../services/queueService.js";

const router = Router();

// POST /api/notifications — send a notification
router.post(
  "/",
  asyncWrap(async (req, res) => {
    const { userId, channel, templateId, title, message, data } = req.body;

    // Basic validation
    if (!userId || !channel) {
      const err = new Error("userId and channel are required");
      err.statusCode = 400;
      throw err;
    }

    if (!Object.values(Channel).includes(channel)) {
      const err = new Error(`Invalid channel. Must be one of: ${Object.values(Channel).join(", ")}`);
      err.statusCode = 400;
      throw err;
    }

    // If templateId is provided, render the template
    let finalTitle = title;
    let finalMessage = message;

    if (templateId) {
      const template = getTemplateById(templateId);
      if (!template) {
        const err = new Error(`Template ${templateId} not found`);
        err.statusCode = 404;
        throw err;
      }
      const rendered = renderTemplate(template, data);
      finalTitle = finalTitle || rendered.subject;
      finalMessage = finalMessage || rendered.body;
    }

    if (!finalTitle || !finalMessage) {
      const err = new Error("title and message are required (or provide a valid templateId with data)");
      err.statusCode = 400;
      throw err;
    }

    const notification = createNotification({
      userId,
      channel,
      templateId,
      title: finalTitle,
      message: finalMessage,
      data,
    });

    // Publish to RabbitMQ queue
    await publishNotification(notification);
    updateNotification(notification.id, { status: NotificationStatus.QUEUED });

    res.status(201).json(notification);
  })
);

// GET /api/notifications — list with optional filters
router.get(
  "/",
  asyncWrap(async (req, res) => {
    const { userId, status, channel } = req.query;
    const results = listNotifications({ userId, status, channel });
    res.json(results);
  })
);

// GET /api/notifications/:id
router.get(
  "/:id",
  asyncWrap(async (req, res) => {
    const notification = getNotificationById(req.params.id);
    if (!notification) {
      const err = new Error("Notification not found");
      err.statusCode = 404;
      throw err;
    }
    res.json(notification);
  })
);

// PATCH /api/notifications/:id/read — mark as read
router.patch(
  "/:id/read",
  asyncWrap(async (req, res) => {
    const updated = updateNotification(req.params.id, {
      status: NotificationStatus.READ,
      readAt: new Date().toISOString(),
    });
    if (!updated) {
      const err = new Error("Notification not found");
      err.statusCode = 404;
      throw err;
    }
    res.json(updated);
  })
);

export default router;
