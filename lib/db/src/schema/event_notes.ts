import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { eventsTable } from "./events";

export const eventNotesTable = pgTable("event_notes", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventNoteSchema = createInsertSchema(eventNotesTable).omit({ id: true, createdAt: true });
export type InsertEventNote = z.infer<typeof insertEventNoteSchema>;
export type EventNote = typeof eventNotesTable.$inferSelect;
