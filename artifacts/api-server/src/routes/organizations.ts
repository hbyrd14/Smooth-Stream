import { Router } from "express";
import { db, organizationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateOrganizationBody } from "@workspace/api-zod";

const router = Router();

router.get("/organizations", async (req, res) => {
  try {
    const orgs = await db.select().from(organizationsTable).orderBy(organizationsTable.name);
    res.json(orgs.map(o => ({
      id: o.id,
      name: o.name,
      createdAt: o.createdAt.toISOString(),
    })));
  } catch (err) {
    req.log.error({ err }, "Failed to list organizations");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/organizations", async (req, res) => {
  try {
    const parsed = CreateOrganizationBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body" });
      return;
    }
    const [org] = await db
      .insert(organizationsTable)
      .values({ name: parsed.data.name })
      .onConflictDoUpdate({ target: organizationsTable.name, set: { name: parsed.data.name } })
      .returning();
    res.status(201).json({
      id: org.id,
      name: org.name,
      createdAt: org.createdAt.toISOString(),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create organization");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
