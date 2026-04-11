import { Router } from "express";
import { db, eventAssetsTable, activityLogTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateEventAssetBody,
  CreateEventAssetParams,
  ListEventAssetsParams,
  UpdateEventAssetBody,
  UpdateEventAssetParams,
} from "@workspace/api-zod";

const router = Router();

const format = (a: typeof eventAssetsTable.$inferSelect) => ({
  id: a.id,
  eventId: a.eventId,
  name: a.name,
  assetType: a.assetType,
  url: a.url ?? null,
  status: a.status,
  notes: a.notes ?? null,
  createdAt: a.createdAt.toISOString(),
});

router.get("/events/:id/assets", async (req, res) => {
  try {
    const params = ListEventAssetsParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const assets = await db
      .select()
      .from(eventAssetsTable)
      .where(eq(eventAssetsTable.eventId, params.data.id))
      .orderBy(eventAssetsTable.createdAt);
    res.json(assets.map(format));
  } catch (err) {
    req.log.error({ err }, "Failed to list assets");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/events/:id/assets", async (req, res) => {
  try {
    const params = CreateEventAssetParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = CreateEventAssetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const [asset] = await db.insert(eventAssetsTable).values({
      eventId: params.data.id,
      name: parsed.data.name,
      assetType: parsed.data.assetType,
      url: parsed.data.url ?? null,
      notes: parsed.data.notes ?? null,
      status: "requested",
    }).returning();

    await db.insert(activityLogTable).values({
      eventId: params.data.id,
      action: "asset_added",
      description: `Asset "${parsed.data.name}" added`,
      actorName: "Internal Team",
    });

    res.status(201).json(format(asset));
  } catch (err) {
    req.log.error({ err }, "Failed to create asset");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/events/:id/assets/:assetId", async (req, res) => {
  try {
    const params = UpdateEventAssetParams.safeParse({
      id: Number(req.params.id),
      assetId: Number(req.params.assetId),
    });
    if (!params.success) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }
    const parsed = UpdateEventAssetBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const [updated] = await db
      .update(eventAssetsTable)
      .set(parsed.data)
      .where(and(
        eq(eventAssetsTable.id, params.data.assetId),
        eq(eventAssetsTable.eventId, params.data.id)
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Asset not found" });
      return;
    }

    res.json(format(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update asset");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
