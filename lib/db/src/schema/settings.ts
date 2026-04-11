import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  eventTypes: text("event_types").array().notNull().default(["Webinar", "Conference", "Product Launch", "Town Hall", "Training", "Panel Discussion", "Workshop"]),
  platformOptions: text("platform_options").array().notNull().default(["Zoom", "Teams", "StreamYard", "vMix", "YouTube Live", "LinkedIn Live", "Vimeo", "Custom RTMP"]),
  defaultChecklistTemplate: text("default_checklist_template").array().notNull().default([
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
    "Post-event review completed"
  ]),
  notificationEmail: text("notification_email"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true, updatedAt: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
