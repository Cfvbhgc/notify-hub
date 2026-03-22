import { Router } from "express";
import { asyncWrap } from "../middleware/errorHandler.js";
import {
  createTemplate,
  getTemplateById,
  listTemplates,
  updateTemplate,
  deleteTemplate,
} from "../models/Template.js";

const router = Router();

// POST /api/templates
router.post(
  "/",
  asyncWrap(async (req, res) => {
    const { name, subject, body, channel } = req.body;

    if (!name || !body) {
      const err = new Error("name and body are required");
      err.statusCode = 400;
      throw err;
    }

    const template = createTemplate({ name, subject, body, channel });
    res.status(201).json(template);
  })
);

// GET /api/templates
router.get(
  "/",
  asyncWrap(async (req, res) => {
    res.json(listTemplates());
  })
);

// GET /api/templates/:id
router.get(
  "/:id",
  asyncWrap(async (req, res) => {
    const template = getTemplateById(req.params.id);
    if (!template) {
      const err = new Error("Template not found");
      err.statusCode = 404;
      throw err;
    }
    res.json(template);
  })
);

// PUT /api/templates/:id
router.put(
  "/:id",
  asyncWrap(async (req, res) => {
    const { name, subject, body, channel } = req.body;
    const updated = updateTemplate(req.params.id, { name, subject, body, channel });
    if (!updated) {
      const err = new Error("Template not found");
      err.statusCode = 404;
      throw err;
    }
    res.json(updated);
  })
);

// DELETE /api/templates/:id
router.delete(
  "/:id",
  asyncWrap(async (req, res) => {
    const deleted = deleteTemplate(req.params.id);
    if (!deleted) {
      const err = new Error("Template not found");
      err.statusCode = 404;
      throw err;
    }
    res.status(204).end();
  })
);

export default router;
