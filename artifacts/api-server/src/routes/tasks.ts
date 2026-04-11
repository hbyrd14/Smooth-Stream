import { Router } from "express";
import { db, eventTasksTable, profilesTable, activityLogTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { UpdateEventTaskBody, UpdateEventTaskParams, ListEventTasksParams } from "@workspace/api-zod";

const router = Router();

router.get("/events/:id/tasks", async (req, res) => {
  try {
    const params = ListEventTasksParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const tasks = await db
      .select({ task: eventTasksTable, userName: profilesTable.name })
      .from(eventTasksTable)
      .leftJoin(profilesTable, eq(eventTasksTable.assignedUserId, profilesTable.id))
      .where(eq(eventTasksTable.eventId, params.data.id))
      .orderBy(eventTasksTable.sortOrder);

    res.json(tasks.map(t => ({
      id: t.task.id,
      eventId: t.task.eventId,
      title: t.task.title,
      status: t.task.status,
      dueDate: t.task.dueDate ? t.task.dueDate.toISOString() : null,
      assignedUserId: t.task.assignedUserId ?? null,
      assignedUserName: t.userName ?? null,
      completedAt: t.task.completedAt ? t.task.completedAt.toISOString() : null,
      sortOrder: t.task.sortOrder,
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list tasks");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/events/:id/tasks/:taskId", async (req, res) => {
  try {
    const params = UpdateEventTaskParams.safeParse({
      id: Number(req.params.id),
      taskId: Number(req.params.taskId),
    });
    if (!params.success) {
      res.status(400).json({ error: "Invalid params" });
      return;
    }
    const parsed = UpdateEventTaskBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const data = parsed.data;
    const updateData: Partial<typeof eventTasksTable.$inferInsert> = {};

    if (data.status !== undefined) {
      updateData.status = data.status;
      if (data.status === "complete") {
        updateData.completedAt = new Date();
      } else {
        updateData.completedAt = null;
      }
    }
    if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.assignedUserId !== undefined) updateData.assignedUserId = data.assignedUserId ?? null;

    const [updated] = await db
      .update(eventTasksTable)
      .set(updateData)
      .where(and(
        eq(eventTasksTable.id, params.data.taskId),
        eq(eventTasksTable.eventId, params.data.id)
      ))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    await db.insert(activityLogTable).values({
      eventId: params.data.id,
      action: "task_updated",
      description: `Task "${updated.title}" updated to ${updated.status}`,
      actorName: "Internal Team",
    });

    const [row] = await db
      .select({ task: eventTasksTable, userName: profilesTable.name })
      .from(eventTasksTable)
      .leftJoin(profilesTable, eq(eventTasksTable.assignedUserId, profilesTable.id))
      .where(eq(eventTasksTable.id, updated.id));

    res.json({
      id: row.task.id,
      eventId: row.task.eventId,
      title: row.task.title,
      status: row.task.status,
      dueDate: row.task.dueDate ? row.task.dueDate.toISOString() : null,
      assignedUserId: row.task.assignedUserId ?? null,
      assignedUserName: row.userName ?? null,
      completedAt: row.task.completedAt ? row.task.completedAt.toISOString() : null,
      sortOrder: row.task.sortOrder,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update task");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
