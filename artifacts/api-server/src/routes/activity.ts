import { Router } from "express";
import { db, activityLogTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { ListEventActivityParams } from "@workspace/api-zod";

const router = Router();

router.get("/events/:id/activity", async (req, res) => {
  try {
    const params = ListEventActivityParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const logs = await db
      .select()
      .from(activityLogTable)
      .where(eq(activityLogTable.eventId, params.data.id))
      .orderBy(desc(activityLogTable.createdAt));

    res.json(logs.map(l => ({
      id: l.id,
      eventId: l.eventId,
      action: l.action,
      description: l.description,
      actorName: l.actorName ?? null,
      createdAt: l.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list activity");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
