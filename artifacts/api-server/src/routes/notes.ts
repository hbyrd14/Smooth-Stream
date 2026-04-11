import { Router } from "express";
import { db, eventNotesTable, activityLogTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { CreateEventNoteBody, CreateEventNoteParams, ListEventNotesParams } from "@workspace/api-zod";

const router = Router();

router.get("/events/:id/notes", async (req, res) => {
  try {
    const params = ListEventNotesParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const notes = await db
      .select()
      .from(eventNotesTable)
      .where(eq(eventNotesTable.eventId, params.data.id))
      .orderBy(desc(eventNotesTable.createdAt));

    res.json(notes.map(n => ({
      id: n.id,
      eventId: n.eventId,
      content: n.content,
      authorName: n.authorName,
      createdAt: n.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list notes");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/events/:id/notes", async (req, res) => {
  try {
    const params = CreateEventNoteParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = CreateEventNoteBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }

    const [note] = await db.insert(eventNotesTable).values({
      eventId: params.data.id,
      content: parsed.data.content,
      authorName: parsed.data.authorName,
    }).returning();

    await db.insert(activityLogTable).values({
      eventId: params.data.id,
      action: "note_added",
      description: `Note added by ${parsed.data.authorName}`,
      actorName: parsed.data.authorName,
    });

    res.status(201).json({
      id: note.id,
      eventId: note.eventId,
      content: note.content,
      authorName: note.authorName,
      createdAt: note.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create note");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
