import { v4 as uuidv4 } from "uuid";

// In-memory store. Good enough for a demo / portfolio project.
const notifications = new Map();

export const NotificationStatus = {
  PENDING: "pending",
  QUEUED: "queued",
  DELIVERED: "delivered",
  FAILED: "failed",
  READ: "read",
};

export const Channel = {
  EMAIL: "email",
  PUSH: "push",
  WEBSOCKET: "websocket",
};

export function createNotification({ userId, channel, templateId, title, message, data }) {
  const notification = {
    id: uuidv4(),
    userId,
    channel,
    templateId: templateId || null,
    title,
    message,
    data: data || {},
    status: NotificationStatus.PENDING,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    readAt: null,
  };
  notifications.set(notification.id, notification);
  return notification;
}

export function getNotificationById(id) {
  return notifications.get(id) || null;
}

export function updateNotification(id, updates) {
  const existing = notifications.get(id);
  if (!existing) return null;
  const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
  notifications.set(id, updated);
  return updated;
}

// Filter notifications by userId, status, channel — all optional
export function listNotifications(filters = {}) {
  let results = Array.from(notifications.values());

  if (filters.userId) {
    results = results.filter((n) => n.userId === filters.userId);
  }
  if (filters.status) {
    results = results.filter((n) => n.status === filters.status);
  }
  if (filters.channel) {
    results = results.filter((n) => n.channel === filters.channel);
  }

  // newest first
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}
