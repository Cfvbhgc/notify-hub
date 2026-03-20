import { v4 as uuidv4 } from "uuid";

const templates = new Map();

/**
 * Templates use simple {{variable}} placeholders.
 * Example: "Hello {{name}}, your order {{orderId}} is ready."
 */

export function createTemplate({ name, subject, body, channel }) {
  const template = {
    id: uuidv4(),
    name,
    subject: subject || "",
    body,
    channel: channel || null, // optional: restrict to specific channel
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  templates.set(template.id, template);
  return template;
}

export function getTemplateById(id) {
  return templates.get(id) || null;
}

export function listTemplates() {
  return Array.from(templates.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export function updateTemplate(id, updates) {
  const existing = templates.get(id);
  if (!existing) return null;

  const updated = {
    ...existing,
    ...updates,
    id: existing.id, // prevent id override
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  templates.set(id, updated);
  return updated;
}

export function deleteTemplate(id) {
  return templates.delete(id);
}

/**
 * Render a template body by replacing {{key}} with values from `data`.
 * Unmatched placeholders are left as-is.
 */
export function renderTemplate(template, data = {}) {
  let rendered = template.body;
  let renderedSubject = template.subject;

  for (const [key, value] of Object.entries(data)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    rendered = rendered.replace(re, String(value));
    renderedSubject = renderedSubject.replace(re, String(value));
  }

  return { subject: renderedSubject, body: rendered };
}
