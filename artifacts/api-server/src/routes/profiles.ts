import { Router } from "express";
import { db, profilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateProfileBody, UpdateProfileBody, UpdateProfileParams, DeleteProfileParams } from "@workspace/api-zod";

const router = Router();

const formatProfile = (p: typeof profilesTable.$inferSelect) => ({
  id: p.id,
  name: p.name,
  email: p.email,
  role: p.role,
  avatarUrl: p.avatarUrl ?? null,
  createdAt: p.createdAt.toISOString(),
});

router.get("/profiles", async (req, res) => {
  try {
    const profiles = await db.select().from(profilesTable).orderBy(profilesTable.name);
    res.json(profiles.map(formatProfile));
  } catch (err) {
    req.log.error({ err }, "Failed to list profiles");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/profiles", async (req, res) => {
  try {
    const parsed = CreateProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const [profile] = await db.insert(profilesTable).values(parsed.data).returning();
    res.status(201).json(formatProfile(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to create profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/profiles/:id", async (req, res) => {
  try {
    const params = UpdateProfileParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    const parsed = UpdateProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const [profile] = await db
      .update(profilesTable)
      .set(parsed.data)
      .where(eq(profilesTable.id, params.data.id))
      .returning();
    if (!profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
    res.json(formatProfile(profile));
  } catch (err) {
    req.log.error({ err }, "Failed to update profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/profiles/:id", async (req, res) => {
  try {
    const params = DeleteProfileParams.safeParse({ id: Number(req.params.id) });
    if (!params.success) {
      res.status(400).json({ error: "Invalid id" });
      return;
    }
    await db.delete(profilesTable).where(eq(profilesTable.id, params.data.id));
    res.status(204).send();
  } catch (err) {
    req.log.error({ err }, "Failed to delete profile");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
