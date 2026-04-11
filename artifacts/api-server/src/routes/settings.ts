import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

const formatSettings = (s: typeof settingsTable.$inferSelect) => ({
  id: s.id,
  eventTypes: s.eventTypes,
  platformOptions: s.platformOptions,
  defaultChecklistTemplate: s.defaultChecklistTemplate,
  notificationEmail: s.notificationEmail ?? null,
  updatedAt: s.updatedAt.toISOString(),
});

async function ensureSettings(req: any) {
  const rows = await db.select().from(settingsTable).limit(1);
  if (rows.length > 0) return rows[0];
  const [created] = await db.insert(settingsTable).values({}).returning();
  return created;
}

router.get("/settings", async (req, res) => {
  try {
    const settings = await ensureSettings(req);
    res.json(formatSettings(settings));
  } catch (err) {
    req.log.error({ err }, "Failed to get settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/settings", async (req, res) => {
  try {
    const parsed = UpdateSettingsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const existing = await ensureSettings(req);
    await db.update(settingsTable).set(parsed.data).where(eq(settingsTable.id, existing.id));
    const [result] = await db.select().from(settingsTable).where(eq(settingsTable.id, existing.id));
    res.json(formatSettings(result));
  } catch (err) {
    req.log.error({ err }, "Failed to update settings");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
