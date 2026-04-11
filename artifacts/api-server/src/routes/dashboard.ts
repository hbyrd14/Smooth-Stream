import { Router } from "express";
import { db, eventsTable, eventTasksTable } from "@workspace/db";
import { sql, gte, and, lte, ne, eq } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  try {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() + 7);

    const [totalResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(eventsTable);

    const [weekResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(eventsTable)
      .where(
        and(
          gte(eventsTable.eventStart, now),
          lte(eventsTable.eventStart, weekEnd)
        )
      );

    const [highPriorityResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(eventsTable)
      .where(
        and(
          sql`${eventsTable.priority} IN ('high', 'critical')`,
          sql`${eventsTable.status} NOT IN ('completed', 'cancelled')`
        )
      );

    const [blockedResult] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(eventTasksTable)
      .where(eq(eventTasksTable.status, "blocked"));

    const deadlineRows = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(eventsTable)
      .where(
        and(
          gte(eventsTable.finalAssetsDueDate, now),
          lte(eventsTable.finalAssetsDueDate, weekEnd),
          sql`${eventsTable.status} NOT IN ('completed', 'cancelled')`
        )
      );

    res.json({
      totalEvents: totalResult.count,
      eventsThisWeek: weekResult.count,
      highPriorityEvents: highPriorityResult.count,
      blockedEvents: blockedResult.count,
      upcomingDeadlines: deadlineRows[0]?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard summary");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
