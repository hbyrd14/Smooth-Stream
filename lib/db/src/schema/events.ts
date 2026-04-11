import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { organizationsTable } from "./organizations";
import { profilesTable } from "./profiles";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  organizationId: integer("organization_id").notNull().references(() => organizationsTable.id),
  organizerName: text("organizer_name").notNull(),
  organizerEmail: text("organizer_email").notNull(),
  organizerPhone: text("organizer_phone"),
  eventType: text("event_type").notNull(),
  eventStart: timestamp("event_start", { withTimezone: true }).notNull(),
  eventEnd: timestamp("event_end", { withTimezone: true }).notNull(),
  timezone: text("timezone").notNull(),
  platform: text("platform").notNull(),
  speakerCount: integer("speaker_count").notNull().default(1),
  speakerDetails: text("speaker_details"),
  assetsNeeded: text("assets_needed"),
  captionsRequired: boolean("captions_required").notNull().default(false),
  translationRequired: boolean("translation_required").notNull().default(false),
  engagementFeatures: text("engagement_features"),
  specialRequirements: text("special_requirements"),
  finalAssetsDueDate: timestamp("final_assets_due_date", { withTimezone: true }),
  priority: text("priority").notNull().default("medium"),
  wantsFullSetup: boolean("wants_full_setup").notNull().default(false),
  status: text("status").notNull().default("new"),
  ownerId: integer("owner_id").references(() => profilesTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEventSchema = createInsertSchema(eventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof eventsTable.$inferSelect;
