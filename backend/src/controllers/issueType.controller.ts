import { Request, Response } from "express";
import pool from "../db/pool";

export async function getIssueTypes(req: Request, res: Response): Promise<void> {
  try {
    const isAdmin = req.user?.role === "admin";
    const query = isAdmin
      ? "SELECT id, name, is_active, created_at FROM issue_types ORDER BY id"
      : "SELECT id, name, is_active, created_at FROM issue_types WHERE is_active = TRUE ORDER BY id";

    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error("Get issue types error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function createIssueType(req: Request, res: Response): Promise<void> {
  const { name } = req.body;

  if (!name?.trim()) {
    res.status(400).json({ error: "Issue type name is required" });
    return;
  }

  try {
    const result = await pool.query(
      "INSERT INTO issue_types (name) VALUES ($1) RETURNING id, name, is_active, created_at",
      [name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Create issue type error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function toggleIssueType(req: Request, res: Response): Promise<void> {
  const issueTypeId = Number(req.params.id);

  try {
    const result = await pool.query(
      `UPDATE issue_types SET is_active = NOT is_active WHERE id = $1
       RETURNING id, name, is_active, created_at`,
      [issueTypeId]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Issue type not found" });
      return;
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Toggle issue type error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
