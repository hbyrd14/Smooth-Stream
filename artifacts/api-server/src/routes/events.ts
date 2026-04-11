import { Router } from "express";
import { db, eventsTable, organizationsTable, profilesTable, eventTasksTable, eventNotesTable, eventAssetsTable, activityLogTable } from "@workspace/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";
import { CreateEventBody, UpdateEventBody, GetEventParams, UpdateEventParams, ListEventsQueryParams } from "@workspace/api-zod";

const router = Router();

const DEFAULT_TASKS = [
  "Intake received",
  "Owner assigned",
  "Client confirmation sent",
  "Assets requested",
  "Assets received",
  "Platform configured",
  "Speaker tech check scheduled",
  "Speaker tech check completed",
  "Captions configured",
  "Translations configured",
  "Dry run completed",
  "Go-live ready",
  "Recording delivered",
  "Post-event review completed",
];

function formatEventSummary(event: typeof eventsTable.$inferSelect, orgName: string, ownerName: string | null) {
  return {
    id: event.id,
    title: event.title,
    organizationName: orgName,
    eventStart: event.eventStart.toISOString(),
    platform: event.platform,
    ownerName: ownerName,
    priority: event.priority,
    status: event.status,
    finalAssetsDueDate: event.finalAssetsDueDate ? event.finalAssetsDueDate.toISOString() : null,
  };
}

function formatEvent(
  event: typeof eventsTable.$inferSelect,
  orgName: string,
  ownerName: string | null
) {
  return {
    id: event.id,
    title: event.title,
    organizationId: event.organizationId,
    organizationName: orgName,
    organizerName: event.organizerName,
    organizerEmail: event.organizerEmail,
    organizerPhone: event.organizerPhone ?? null,
    eventType: event.eventType,
    eventStart: event.eventStart.toISOString(),
    eventEnd: event.eventEnd.toISOString(),
    timezone: event.timezone,
    platform: event.platform,
    speakerCount: event.speakerCount,
    speakerDetails: event.speakerDetails ?? null,
    assetsNeeded: event.assetsNeeded ?? null,
    captionsRequired: event.captionsRequired,
    translationRequired: event.translationRequired,
    engagementFeatures: event.engagementFeatures ?? null,
    specialRequirements: event.specialRequirements ?? null,
    finalAssetsDueDate: event.finalAssetsDueDate ? event.finalAssetsDueDate.toISOString() : null,
    priority: event.priority,
    wantsFullSetup: event.wantsFullSetup,
    status: event.status,
    ownerId: event.ownerId ?? null,
    ownerName: ownerName,
    createdAt: event.createdAt.toISOString(),
  };
}

router.get("/events", async (req, res) => {
  try {
    const parsed = ListEventsQueryParams.safeParse(req.query);
    const filter = parsed.success ? parsed.data.filter : "all";
    const search = parsed.success ? parsed.data.search : undefined;

    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const rows = await db
      .select({
        event: eventsTable,
        orgName: organizationsTable.name,
        ownerName: profilesTable.name,
      })
      .from(eventsTable)
      .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id))
      .leftJoin(profilesTable, eq(eventsTable.ownerId, profilesTable.id))
      .orderBy(desc(eventsTable.eventStart));

    let filtered = rows;

    if (filter === "this_week") {
      filtered = rows.filter(r => {
        const start = r.event.eventStart;
        return start >= now && start <= weekEnd;
      });
    } else if (filter === "high_priority") {
      filtered = rows.filter(r => r.event.priority === "high" || r.event.priority === "critical");
    } else if (filter === "awaiting_assets") {
      filtered = rows.filter(r => r.event.status === "awaiting_assets");
    } else if (filter === "ready_for_tech_check") {
      filtered = rows.filter(r => r.event.status === "ready_for_tech_check");
    } else if (filter === "ready_for_live") {
      filtered = rows.filter(r => r.event.status === "ready_for_live");
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(r =>
        r.event.title.toLowerCase().includes(q) ||
        (r.orgName ?? "").toLowerCase().includes(q) ||
        r.event.organizerName.toLowerCase().includes(q)
      );
    }

    res.json(filtered.map(r => formatEventSummary(r.event, r.orgName ?? "", r.ownerName ?? null)));
  } catch (err) {
    req.log.error({ err }, "Failed to list events");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/events", async (req, res) => {
  try {
    const parsed = CreateEventBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const data = parsed.data;

    // Upsert organization
    const [org] = await db
      .insert(organizationsTable)
      .values({ name: data.organizationName })
      .onConflictDoUpdate({ target: organizationsTable.name, set: { name: data.organizationName } })
      .returning();

    // Create event
    const [event] = await db.insert(eventsTable).values({
      title: data.title,
      organizationId: org.id,
      organizerName: data.organizerName,
      organizerEmail: data.organizerEmail,
      organizerPhone: data.organizerPhone ?? null,
      eventType: data.eventType,
      eventStart: new Date(data.eventStart),
      eventEnd: new Date(data.eventEnd),
      timezone: data.timezone,
      platform: data.platform,
      speakerCount: data.speakerCount,
      speakerDetails: data.speakerDetails ?? null,
      assetsNeeded: data.assetsNeeded ?? null,
      captionsRequired: data.captionsRequired,
      translationRequired: data.translationRequired,
      engagementFeatures: data.engagementFeatures ?? null,
      specialRequirements: data.specialRequirements ?? null,
      finalAssetsDueDate: data.finalAssetsDueDate ? new Date(data.finalAssetsDueDate) : null,
      priority: data.priority,
      wantsFullSetup: data.wantsFullSetup,
      status: "new",
    }).returning();

    // Create default checklist tasks
    const taskInserts = DEFAULT_TASKS.map((title, idx) => ({
      eventId: event.id,
      title,
      status: idx === 0 ? "complete" : "pending",
      sortOrder: idx,
      completedAt: idx === 0 ? new Date() : null,
    }));
    await db.insert(eventTasksTable).values(taskInserts);

    // Log activity
    await db.insert(activityLogTable).values({
      eventId: event.id,
      action: "event_created",
      description: `Event "${event.title}" was created via public intake form`,
      actorName: data.organizerName,
    });

    res.status(201).json(formatEvent(event, org.name, null));
  } catch (err) {
    req.log.error({ err }, "Failed to create event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/events/:id", async (req, res) => {
  try {
    const params = GetEventParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [row] = await db
      .select({
        event: eventsTable,
        orgName: organizationsTable.name,
        ownerName: profilesTable.name,
      })
      .from(eventsTable)
      .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id))
      .leftJoin(profilesTable, eq(eventsTable.ownerId, profilesTable.id))
      .where(eq(eventsTable.id, params.data.id));

    if (!row) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const tasks = await db
      .select({ task: eventTasksTable, userName: profilesTable.name })
      .from(eventTasksTable)
      .leftJoin(profilesTable, eq(eventTasksTable.assignedUserId, profilesTable.id))
      .where(eq(eventTasksTable.eventId, params.data.id))
      .orderBy(eventTasksTable.sortOrder);

    const notes = await db
      .select()
      .from(eventNotesTable)
      .where(eq(eventNotesTable.eventId, params.data.id))
      .orderBy(desc(eventNotesTable.createdAt));

    const assets = await db
      .select()
      .from(eventAssetsTable)
      .where(eq(eventAssetsTable.eventId, params.data.id))
      .orderBy(eventAssetsTable.createdAt);

    const activity = await db
      .select()
      .from(activityLogTable)
      .where(eq(activityLogTable.eventId, params.data.id))
      .orderBy(desc(activityLogTable.createdAt));

    res.json({
      ...formatEvent(row.event, row.orgName ?? "", row.ownerName ?? null),
      tasks: tasks.map(t => ({
        id: t.task.id,
        eventId: t.task.eventId,
        title: t.task.title,
        status: t.task.status,
        dueDate: t.task.dueDate ? t.task.dueDate.toISOString() : null,
        assignedUserId: t.task.assignedUserId ?? null,
        assignedUserName: t.userName ?? null,
        completedAt: t.task.completedAt ? t.task.completedAt.toISOString() : null,
        sortOrder: t.task.sortOrder,
      })),
      notes: notes.map(n => ({
        id: n.id,
        eventId: n.eventId,
        content: n.content,
        authorName: n.authorName,
        createdAt: n.createdAt.toISOString(),
      })),
      assets: assets.map(a => ({
        id: a.id,
        eventId: a.eventId,
        name: a.name,
        assetType: a.assetType,
        url: a.url ?? null,
        status: a.status,
        notes: a.notes ?? null,
        createdAt: a.createdAt.toISOString(),
      })),
      activityLog: activity.map(l => ({
        id: l.id,
        eventId: l.eventId,
        action: l.action,
        description: l.description,
        actorName: l.actorName ?? null,
        createdAt: l.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get event");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/events/:id", async (req, res) => {
  try {
    const params = UpdateEventParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateEventBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const data = parsed.data;
    const updateData: Partial<typeof eventsTable.$inferInsert> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.eventType !== undefined) updateData.eventType = data.eventType;
    if (data.eventStart !== undefined) updateData.eventStart = new Date(data.eventStart);
    if (data.eventEnd !== undefined) updateData.eventEnd = new Date(data.eventEnd);
    if (data.timezone !== undefined) updateData.timezone = data.timezone;
    if (data.platform !== undefined) updateData.platform = data.platform;
    if (data.speakerCount !== undefined) updateData.speakerCount = data.speakerCount;
    if (data.speakerDetails !== undefined) updateData.speakerDetails = data.speakerDetails;
    if (data.assetsNeeded !== undefined) updateData.assetsNeeded = data.assetsNeeded;
    if (data.captionsRequired !== undefined) updateData.captionsRequired = data.captionsRequired;
    if (data.translationRequired !== undefined) updateData.translationRequired = data.translationRequired;
    if (data.engagementFeatures !== undefined) updateData.engagementFeatures = data.engagementFeatures;
    if (data.specialRequirements !== undefined) updateData.specialRequirements = data.specialRequirements;
    if (data.finalAssetsDueDate !== undefined) updateData.finalAssetsDueDate = data.finalAssetsDueDate ? new Date(data.finalAssetsDueDate) : null;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.wantsFullSetup !== undefined) updateData.wantsFullSetup = data.wantsFullSetup;
    if (data.status !== undefined) updateData.status = data.status;
    if ("ownerId" in data) updateData.ownerId = data.ownerId ?? null;

    const [updated] = await db
      .update(eventsTable)
      .set(updateData)
      .where(eq(eventsTable.id, params.data.id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    // Log activity
    const changes = Object.keys(updateData).join(", ");
    await db.insert(activityLogTable).values({
      eventId: updated.id,
      action: "event_updated",
      description: `Event updated: ${changes}`,
      actorName: "Internal Team",
    });

    const [row] = await db
      .select({
        event: eventsTable,
        orgName: organizationsTable.name,
        ownerName: profilesTable.name,
      })
      .from(eventsTable)
      .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id))
      .leftJoin(profilesTable, eq(eventsTable.ownerId, profilesTable.id))
      .where(eq(eventsTable.id, updated.id));

    res.json(formatEvent(row.event, row.orgName ?? "", row.ownerName ?? null));
  } catch (err) {
    req.log.error({ err }, "Failed to update event");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
