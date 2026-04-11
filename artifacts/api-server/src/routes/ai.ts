import { Router } from "express";
import { db, eventsTable, organizationsTable, eventTasksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GenerateRunOfShowParams, GenerateClientReminderParams } from "@workspace/api-zod";

const router = Router();

router.post("/events/:id/ai/run-of-show", async (req, res) => {
  try {
    const params = GenerateRunOfShowParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [row] = await db
      .select({ event: eventsTable, orgName: organizationsTable.name })
      .from(eventsTable)
      .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id))
      .where(eq(eventsTable.id, params.data.id));

    if (!row) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const e = row.event;
    const startTime = new Date(e.eventStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const endTime = new Date(e.eventEnd).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const date = new Date(e.eventStart).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    const draft = `RUN OF SHOW — ${e.title.toUpperCase()}
${row.orgName ?? ""}  |  ${date}
Platform: ${e.platform}  |  Timezone: ${e.timezone}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PRE-SHOW (60 minutes before ${startTime})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□  T-60 min — Tech team opens virtual room / tests platform
□  T-60 min — Confirm all speaker links active
□  T-45 min — Speaker A/V checks begin (${e.speakerCount} speaker${e.speakerCount !== 1 ? "s" : ""})
□  T-30 min — Slides/assets loaded and tested
${e.captionsRequired ? "□  T-30 min — Captions enabled and verified\n" : ""}${e.translationRequired ? "□  T-30 min — Translation stream confirmed\n" : ""}□  T-15 min — Run countdown loop / holding music
□  T-10 min — Producer final comms with speakers
□  T-5 min  — Attendees admitted / lobby opens

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LIVE SHOW  (${startTime} – ${endTime})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□  ${startTime}       — Welcome / open
□  ${startTime} +5m  — Host introduction
□  ${startTime} +10m — Main content begins
□  [Add your session segments here]
${e.engagementFeatures ? `□  Engagement: ${e.engagementFeatures}\n` : ""}□  ${endTime} -10m — Q&A opens
□  ${endTime} -5m  — Closing remarks / CTA
□  ${endTime}       — Stream ends

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
POST-SHOW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□  Stop recording
□  Download / archive recording
□  Send recording to client
□  Post-event debrief

SPECIAL NOTES:
${e.specialRequirements ?? "None"}

[This draft was generated from event data. Review and adjust timing as needed.]`;

    res.json({ draft, type: "run_of_show" });
  } catch (err) {
    req.log.error({ err }, "Failed to generate run of show");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/events/:id/ai/client-reminder", async (req, res) => {
  try {
    const params = GenerateClientReminderParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }

    const [row] = await db
      .select({ event: eventsTable, orgName: organizationsTable.name })
      .from(eventsTable)
      .leftJoin(organizationsTable, eq(eventsTable.organizationId, organizationsTable.id))
      .where(eq(eventsTable.id, params.data.id));

    if (!row) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const e = row.event;
    const dateStr = new Date(e.eventStart).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = new Date(e.eventStart).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
    const dueDate = e.finalAssetsDueDate
      ? new Date(e.finalAssetsDueDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
      : "[assets due date TBD]";

    const draft = `Subject: Action Required — ${e.title} (${dateStr})

Hi ${e.organizerName},

I hope you're doing well! I'm reaching out with an important reminder as we get closer to your upcoming event.

EVENT DETAILS
─────────────────────────────────
Event: ${e.title}
Organization: ${row.orgName ?? ""}
Date: ${dateStr}
Time: ${timeStr} ${e.timezone}
Platform: ${e.platform}
─────────────────────────────────

OUTSTANDING ITEMS
We need the following from you by ${dueDate}:

${e.assetsNeeded ? `• Assets needed:\n  ${e.assetsNeeded}\n` : ""}• Final speaker names and titles (if not already submitted)
• Any slide decks or presentation materials
• Company logo (PNG, high resolution)
• Any specific run-of-show notes or agenda items

SPEAKER TECH CHECK
We'll be scheduling individual tech checks with each speaker before the event. Please confirm speaker availability and share their contact information so we can coordinate.

${e.captionsRequired ? "CAPTIONS\nYou have requested live captions. Please confirm the captioning language and any specialized vocabulary we should be aware of.\n\n" : ""}${e.translationRequired ? "TRANSLATION\nYou have requested translation services. Please confirm the target language(s) and interpretation method.\n\n" : ""}If you have any questions or updates, please don't hesitate to reach out. We want to make sure your event runs flawlessly.

Warm regards,
[Your Name]
SmoothStream Production Team
[Your Email] | [Your Phone]

[This draft was generated from event data. Personalize before sending.]`;

    res.json({ draft, type: "client_reminder" });
  } catch (err) {
    req.log.error({ err }, "Failed to generate client reminder");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
