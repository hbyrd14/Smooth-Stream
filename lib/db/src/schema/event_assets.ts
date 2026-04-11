import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { eventsTable } from "./events";

export const eventAssetsTable = pgTable("event_assets", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => eventsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  assetType: text("asset_type").notNull(),
  url: text("url"),
  status: text("status").notNull().default("requested"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEventAssetSchema = createInsertSchema(eventAssetsTable).omit({ id: true, createdAt: true });
export type InsertEventAsset = z.infer<typeof insertEventAssetSchema>;
export type EventAsset = typeof eventAssetsTable.$inferSelect;
